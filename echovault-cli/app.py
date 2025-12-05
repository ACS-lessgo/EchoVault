from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, VerticalScroll
from textual.widgets import Button, DataTable, Footer, Header, Input, Label, Static
from textual.reactive import reactive
from pathlib import Path
import pygame
import random
from threading import Thread
import time
from db import SonicDB

# Widget 1 for managing music directories
class DirectoryManager(Container):
    
    def compose(self) -> ComposeResult:
        yield Label("Music Directories", classes="section-title")
        yield Horizontal(
            Input(placeholder="Enter directory path...", id="dir-input"),
            Button("+", id="add-dir", variant="default"),
            Button("-", id="remove-dir", variant="default"),
            classes="input-row"
        )
        yield DataTable(id="dir-table", show_cursor=True)
    
    def on_mount(self) -> None:
        table = self.query_one("#dir-table", DataTable)
        table.add_columns("Path", "Status", "Files")
        table.cursor_type = "row"


# Widget 2 for playing music
class MusicPlayer(Container):    
    current_track = reactive("")
    is_playing = reactive(False)
    repeat_mode = reactive(False)
    shuffle_mode = reactive(False)
    volume = reactive(0.7)
    position = reactive(0.0)
    duration = reactive(0.0)
    
    def compose(self) -> ComposeResult:
        yield Label("Music Library", classes="section-title")
        yield Horizontal(
            Button("▸ Play", id="play", variant="default"),
            Button("⏸ Pause", id="pause", variant="default"),
            Button("⏹ Stop", id="stop", variant="default"),
            Button("⇥ Next", id="next", variant="default"),
            Button("⇤ Previous", id="prev", variant="default"),
            classes="controls"
        )
        yield Horizontal(
            Button("⧉ Shuffle", id="shuffle"),
            Button("⟲ Repeat", id="repeat"),
            Button("+ Volume", id="vol-up"),
            Button("- Volume", id="vol-down"),
            classes="controls"
        )
        yield Static(id="now-playing", classes="now-playing")
        yield Static(id="playback-info", classes="playback-info")
        yield DataTable(id="music-table", show_cursor=True)
    
    def on_mount(self) -> None:
        table = self.query_one("#music-table", DataTable)
        table.add_columns("Title", "Path")
        table.cursor_type = "row"
        self.update_now_playing()
        # timer to update playback position
        self.set_interval(0.5, self.update_playback_info)
    
    def watch_current_track(self) -> None:
        self.update_now_playing()
    
    def watch_shuffle_mode(self) -> None:
        self.query_one("#shuffle", Button)
        
    def watch_repeat_mode(self) -> None:
        self.query_one("#repeat", Button)
    
    def watch_volume(self) -> None:
        self.update_now_playing()
    
    def update_now_playing(self) -> None:
        now_playing = self.query_one("#now-playing", Static)
        if self.current_track:
            status = "▸ Playing" if self.is_playing else "⏸ Paused"
            track_name = Path(self.current_track).name
            modes = []
            if self.shuffle_mode:
                modes.append("⧉")
            if self.repeat_mode:
                modes.append("⟲")
            mode_str = " ".join(modes)
            vol_percent = int(self.volume * 100)
            now_playing.update(f"{status}: {track_name} {mode_str} | Volume: {vol_percent}%")
        else:
            now_playing.update("No track selected")
    
    def update_playback_info(self) -> None:
        # update playback position info
        playback_info = self.query_one("#playback-info", Static)
        if self.is_playing and pygame.mixer.music.get_busy():
            # curr posi in seconds
            pos = pygame.mixer.music.get_pos() / 1000.0
            if pos >= 0:
                self.position = pos
                pos_min, pos_sec = divmod(int(pos), 60)
                playback_info.update(f"Position: {pos_min:02d}:{pos_sec:02d}")
        elif not self.is_playing:
            playback_info.update("⏹ Paused")


class EchoVault(App):    
    CSS_PATH = "player.tcss"
    
    BINDINGS = [
        ("d", "toggle_dark", "Toggle dark mode"),
        ("q", "quit", "Quit"),
        ("s", "scan_all", "Scan all directories"),
        ("space", "play_pause", "Play/Pause"),
        ("n", "next_track", "Next"),
        ("p", "prev_track", "Previous"),
    ]
    
    def __init__(self):
        super().__init__()
        
        # get sqlite db here
        user_data_dir = Path.home() / ".config" / "sonicbox"
        user_data_dir.mkdir(exist_ok=True)
        db_path = user_data_dir / "sonicbox.db"
        self.db = SonicDB(db_path)
        
        self.directories = []
        self.music_files = []
        self.current_index = -1
        self.supported_formats = {".mp4", ".wav", ".flac", ".ogg", ".mp3"}
        
        #init pygame mixer for playback
        try:
            # 44.1 kHz, 16-bit, 2 channels
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            pygame.mixer.music.set_volume(0.7)
            self.music_end_event = pygame.USEREVENT + 1
            pygame.mixer.music.set_endevent(self.music_end_event)
            # thread will monitor pygame events
            self.monitoring = True
            self.monitor_thread = Thread(target=self.monitor_music_end, daemon=True)
            self.monitor_thread.start()
        except Exception as e:
            self.notify(f"Failed to initialize audio: {str(e)}", severity="error")
    
    def monitor_music_end(self):
        # music end events in a separate thread
        while self.monitoring:
            try:
                # only get events if pygame instance available
                if pygame.get_init():
                    for event in pygame.event.get():
                        if event.type == self.music_end_event:
                            self.call_from_thread(self.on_music_end)
                else:
                    break
                time.sleep(0.1)
            except (pygame.error, AttributeError):
                break
    
    def on_music_end(self):
        player = self.query_one(MusicPlayer)
        if player.repeat_mode:
            # repeat
            self.play_current_track()
        else:
            # play next
            self.play_next()
    
    def compose(self) -> ComposeResult:
        yield Header()
        yield Footer()
        # scrollable container
        yield VerticalScroll(
            DirectoryManager(),
            MusicPlayer(),
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        
        if button_id == "add-dir":
            self.add_directory()
        elif button_id == "remove-dir":
            self.remove_directory()
        elif button_id == "play":
            self.play_selected()
        elif button_id == "pause":
            self.pause_playback()
        elif button_id == "stop":
            self.stop_playback()
        elif button_id == "next":
            self.play_next()
        elif button_id == "prev":
            self.play_previous()
        elif button_id == "shuffle":
            self.toggle_shuffle()
        elif button_id == "repeat":
            self.toggle_repeat()
        elif button_id == "vol-up":
            self.volume_up()
        elif button_id == "vol-down":
            self.volume_down()
    
    def add_directory(self) -> None:
        """Add a directory to the list."""
        input_widget = self.query_one("#dir-input", Input)
        dir_path = input_widget.value.strip()
        
        if not dir_path:
            return
        
        path = Path(dir_path).expanduser()
        
        if not path.exists():
            self.notify(f"Directory does not exist: {dir_path}", severity="error")
            return
        
        if not path.is_dir():
            self.notify(f"Not a directory: {dir_path}", severity="error")
            return
        
        if str(path) in self.directories:
            self.notify(f"Directory already added", severity="warning")
            return
        
        self.directories.append(str(path))
        self.update_directory_table()
        self.scan_directory(str(path))
        input_widget.value = ""
        self.notify(f"Added directory: {path.name}", severity="information")
    
    def remove_directory(self) -> None:
        table = self.query_one("#dir-table", DataTable)
        
        if table.row_count == 0:
            self.notify("No directories to remove", severity="warning")
            return
        
        if table.cursor_row < 0:
            return
        
        row_index = table.cursor_row
        if 0 <= row_index < len(self.directories):
            removed_dir = self.directories.pop(row_index)
            # Remove music files from this directory
            self.music_files = [f for f in self.music_files if not f.startswith(removed_dir)]
            self.update_directory_table()
            self.update_music_table()
            self.notify(f"Removed directory: {Path(removed_dir).name}", severity="information")
    
    def update_directory_table(self) -> None:
        table = self.query_one("#dir-table", DataTable)
        table.clear()
        
        for dir_path in self.directories:
            path = Path(dir_path)
            file_count = sum(1 for f in self.music_files if f.startswith(dir_path))
            table.add_row(str(path), "✓ Scanned", str(file_count))
    
    def scan_directory(self, dir_path: str) -> None:
        path = Path(dir_path)
        new_files = []
        
        try:
            for file_path in path.rglob("*"):
                if file_path.is_file() and file_path.suffix.lower() in self.supported_formats:
                    file_str = str(file_path)
                    if file_str not in self.music_files:
                        new_files.append(file_str)
            
            self.music_files.extend(new_files)
            self.update_music_table()
            self.update_directory_table()
            self.notify(f"Found {len(new_files)} music files", severity="information")
        except Exception as e:
            self.notify(f"Error scanning directory: {str(e)}", severity="error")
    
    def update_music_table(self) -> None:
        table = self.query_one("#music-table", DataTable)
        table.clear()
        
        for file_path in self.music_files:
            path = Path(file_path)
            table.add_row(path.name, str(path.parent))
    
    def play_selected(self) -> None:
        table = self.query_one("#music-table", DataTable)
        
        if table.row_count == 0:
            self.notify("No music files available", severity="warning")
            return
        
        if table.cursor_row < 0:
            return
        
        self.current_index = table.cursor_row
        self.play_current_track()
    
    def play_current_track(self) -> None:
        if self.current_index < 0 or self.current_index >= len(self.music_files):
            return
        
        player = self.query_one(MusicPlayer)
        track_path = self.music_files[self.current_index]
        
        try:
            pygame.mixer.music.load(track_path)
            pygame.mixer.music.play()
            player.current_track = track_path
            player.is_playing = True
            player.position = 0.0
            
            # Update table cursor
            table = self.query_one("#music-table", DataTable)
            table.cursor_coordinate = (self.current_index, 0)
            
            self.notify(f"Playing: {Path(track_path).name}", severity="information")
        except Exception as e:
            self.notify(f"Error playing track: {str(e)}", severity="error")
    
    def pause_playback(self) -> None:
        player = self.query_one(MusicPlayer)
        
        if player.is_playing:
            pygame.mixer.music.pause()
            player.is_playing = False
        else:
            pygame.mixer.music.unpause()
            player.is_playing = True
    
    def stop_playback(self) -> None:
        player = self.query_one(MusicPlayer)
        pygame.mixer.music.stop()
        player.is_playing = False
        player.position = 0.0
    
    def play_next(self) -> None:
        if not self.music_files:
            return
        
        player = self.query_one(MusicPlayer)
        
        if player.shuffle_mode:
            self.current_index = random.randint(0, len(self.music_files) - 1)
        else:
            self.current_index = (self.current_index + 1) % len(self.music_files)
        
        self.play_current_track()
    
    def play_previous(self) -> None:
        if not self.music_files:
            return
        
        self.current_index = (self.current_index - 1) % len(self.music_files)
        self.play_current_track()
    
    def toggle_shuffle(self) -> None:
        player = self.query_one(MusicPlayer)
        player.shuffle_mode = not player.shuffle_mode
        mode = "enabled" if player.shuffle_mode else "disabled"
        self.notify(f"Shuffle {mode}", severity="information")
    
    def toggle_repeat(self) -> None:
        player = self.query_one(MusicPlayer)
        player.repeat_mode = not player.repeat_mode
        mode = "enabled" if player.repeat_mode else "disabled"
        self.notify(f"Repeat {mode}", severity="information")
    
    def volume_up(self) -> None:
        player = self.query_one(MusicPlayer)
        player.volume = min(1.0, player.volume + 0.1)
        pygame.mixer.music.set_volume(player.volume)
    
    def volume_down(self) -> None:
        player = self.query_one(MusicPlayer)
        player.volume = max(0.0, player.volume - 0.1)
        pygame.mixer.music.set_volume(player.volume)
    
    def action_toggle_dark(self) -> None:
        self.theme = "textual-dark" if self.theme == "textual-light" else "textual-light"
    
    def action_scan_all(self) -> None:
        self.music_files.clear()
        for dir_path in self.directories:
            self.scan_directory(dir_path)
    
    def action_play_pause(self) -> None:
        player = self.query_one(MusicPlayer)
        if player.current_track:
            self.pause_playback()
        else:
            self.play_selected()
    
    def action_next_track(self) -> None:
        self.play_next()
    
    def action_prev_track(self) -> None:
        self.play_previous()
    
    def on_data_table_row_selected(self, event) -> None:
        if event.data_table.id == "dir-table":
            row_index = event.cursor_row
            if 0 <= row_index < len(self.directories):
                selected_dir = self.directories[row_index]
                self.notify(f"Selected: {Path(selected_dir).name}")
        elif event.data_table.id == "music-table":
            self.play_selected()
    
    def on_unmount(self) -> None:
        # Stop monitoring thread
        self.monitoring = False
        
        # Wait for thread to finish (with timeout)
        if hasattr(self, 'monitor_thread') and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2.0)
        
        # Clean up pygame resources
        try:
            if pygame.mixer.get_init():
                pygame.mixer.music.stop()
                pygame.mixer.quit()
        except:
            pass


if __name__ == "__main__":
    app = EchoVault()
    app.run()
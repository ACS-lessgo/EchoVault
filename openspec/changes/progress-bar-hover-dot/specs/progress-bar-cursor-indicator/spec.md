## ADDED Requirements

### Requirement: Cursor-tracking dot on progress bar hover
The system SHALL display a visual dot on the playback progress bar at the mouse cursor's horizontal position while the cursor hovers over the bar.

#### Scenario: Hovering the progress bar
- **WHEN** the user moves the mouse over the playback progress bar
- **THEN** a dot appears on the bar at the cursor's x-position, updating as the cursor moves

#### Scenario: Cursor leaves the progress bar
- **WHEN** the user moves the mouse off the playback progress bar
- **THEN** the cursor dot is hidden

#### Scenario: Consistent across player views
- **WHEN** the user hovers the progress bar in the main player bar, mini player, or immersive mode
- **THEN** the same cursor-dot behavior applies in all three

#### Scenario: Clicking still seeks as before
- **WHEN** the user clicks the progress bar at the cursor dot's position
- **THEN** playback seeks to that position, unchanged from existing click-to-seek behavior

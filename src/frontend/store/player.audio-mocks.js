// Minimal Web Audio / HTMLMediaElement stand-ins for player.js's module-level
// graph (jsdom implements neither). Import this BEFORE player.js in any test
// file that touches the player store — static imports evaluate in source
// order, so stubbing here runs before player.js's top-level `new AudioContext()`.
import { vi } from "vitest"

export const audioMocks = {
  context: null,
  gains: [],
  filters: [],
  analysers: [],
  audioElements: [],
}

class MockAudioParam {
  constructor(value = 0) {
    this.value = value
    this.setTargetAtTime = vi.fn((target) => {
      this.value = target
    })
  }
}

class MockGainNode {
  constructor() {
    this.gain = new MockAudioParam(1)
    this.connect = vi.fn()
    audioMocks.gains.push(this)
  }
}

class MockBiquadFilterNode {
  constructor() {
    this.type = "peaking"
    this.frequency = new MockAudioParam(0)
    this.Q = new MockAudioParam(0)
    this.gain = new MockAudioParam(0)
    this.connect = vi.fn()
    audioMocks.filters.push(this)
  }
}

class MockAnalyserNode {
  constructor() {
    this.fftSize = 2048
    this.connect = vi.fn()
    this.getFloatTimeDomainData = vi.fn((buf) => buf.fill(0))
    audioMocks.analysers.push(this)
  }
}

class MockMediaElementSourceNode {
  constructor() {
    this.connect = vi.fn()
  }
}

class MockAudioContext {
  constructor() {
    this.destination = {}
    this.currentTime = 0
    this.state = "running"
    this.sampleRate = 48000
    this.resume = vi.fn(() => {
      this.state = "running"
      return Promise.resolve()
    })
    this.createGain = vi.fn(() => new MockGainNode())
    this.createBiquadFilter = vi.fn(() => new MockBiquadFilterNode())
    this.createAnalyser = vi.fn(() => new MockAnalyserNode())
    this.createMediaElementSource = vi.fn(() => new MockMediaElementSourceNode())
    audioMocks.context = this
  }
}

class MockAudioElement {
  constructor() {
    this.src = ""
    this.crossOrigin = null
    this.currentTime = 0
    this.duration = NaN
    this.paused = true
    this.onended = null
    this.readyState = 0
    this.play = vi.fn(() => {
      this.paused = false
      return Promise.resolve()
    })
    this.pause = vi.fn(() => {
      this.paused = true
    })
    this.load = vi.fn()
    audioMocks.audioElements.push(this)
  }
}

vi.stubGlobal("AudioContext", MockAudioContext)
vi.stubGlobal("Audio", MockAudioElement)

if (!navigator.mediaDevices) {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      enumerateDevices: vi.fn(() => Promise.resolve([])),
      getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [] })),
    },
    configurable: true,
  })
}

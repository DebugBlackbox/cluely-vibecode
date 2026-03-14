import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron before importing the module
vi.mock('electron', () => import('../__mocks__/electron'))

describe('screenCapture', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a non-empty base64 string', async () => {
    const { desktopCapturer, nativeImage } = await import('electron')
    const mockPng = Buffer.from('fake-png-data')
    const mockImage = {
      toPNG: vi.fn(() => mockPng),
      getSize: vi.fn(() => ({ width: 800, height: 600 })),
      resize: vi.fn(function (this: any) { return this }),
      isEmpty: vi.fn(() => false),
    }
    ;(desktopCapturer.getSources as any).mockResolvedValueOnce([
      {
        id: 'screen:0',
        name: 'Entire Screen',
        thumbnail: mockImage,
        display_id: '1',
        appIcon: null,
      },
    ])
    ;(nativeImage.createFromBuffer as any).mockReturnValue(mockImage)

    const { captureScreen } = await import('../../src/main/capture/screenCapture')
    const result = await captureScreen()

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('does not include data:image/png;base64, prefix', async () => {
    const { desktopCapturer, nativeImage } = await import('electron')
    const mockPng = Buffer.from('fake-png-data')
    const mockImage = {
      toPNG: vi.fn(() => mockPng),
      getSize: vi.fn(() => ({ width: 800, height: 600 })),
      resize: vi.fn(function (this: any) { return this }),
      isEmpty: vi.fn(() => false),
    }
    ;(desktopCapturer.getSources as any).mockResolvedValueOnce([
      { id: 'screen:0', name: 'Entire Screen', thumbnail: mockImage, display_id: '1', appIcon: null },
    ])
    ;(nativeImage.createFromBuffer as any).mockReturnValue(mockImage)

    const { captureScreen } = await import('../../src/main/capture/screenCapture')
    const result = await captureScreen()

    expect(result).not.toContain('data:image/png;base64,')
  })

  it('throws a descriptive error if getSources returns empty array', async () => {
    const { desktopCapturer } = await import('electron')
    ;(desktopCapturer.getSources as any).mockResolvedValueOnce([])

    const { captureScreen } = await import('../../src/main/capture/screenCapture')
    await expect(captureScreen()).rejects.toThrow(/no screen sources/i)
  })

  it('downscales images wider than 1280px', async () => {
    const { desktopCapturer, nativeImage } = await import('electron')
    const mockPng = Buffer.from('big-png-data')
    const resizeMock = vi.fn(function (this: any) { return this })
    const mockImage = {
      toPNG: vi.fn(() => mockPng),
      getSize: vi.fn(() => ({ width: 1920, height: 1080 })),
      resize: resizeMock,
      isEmpty: vi.fn(() => false),
    }
    ;(desktopCapturer.getSources as any).mockResolvedValueOnce([
      { id: 'screen:0', name: 'Entire Screen', thumbnail: mockImage, display_id: '1', appIcon: null },
    ])
    ;(nativeImage.createFromBuffer as any).mockReturnValue(mockImage)

    const { captureScreen } = await import('../../src/main/capture/screenCapture')
    await captureScreen()

    expect(resizeMock).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1280 })
    )
  })
})

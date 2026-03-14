import { desktopCapturer } from 'electron'
import { SCREENSHOT_MAX_WIDTH } from '../../shared/constants'

export async function captureScreen(): Promise<string> {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 },
  })

  if (sources.length === 0) {
    throw new Error('captureScreen: no screen sources available from desktopCapturer')
  }

  const source = sources[0]
  let image = source.thumbnail

  // Downscale to max width preserving aspect ratio
  const size = image.getSize()
  if (size.width > SCREENSHOT_MAX_WIDTH) {
    const aspectRatio = size.height / size.width
    const newHeight = Math.round(SCREENSHOT_MAX_WIDTH * aspectRatio)
    image = image.resize({ width: SCREENSHOT_MAX_WIDTH, height: newHeight })
  }

  // Return raw base64 PNG without data URI prefix
  const buffer = image.toPNG()
  return buffer.toString('base64')
}

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DecoderValidator from 'App/Validators/DecoderValidator'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import got from 'got'

export default class DecodesController {
  public async index({ request, response }: HttpContextContract) {
    try {
      const { fileurl } = await request.validate(DecoderValidator)

      const imgResponse = await got(fileurl, { responseType: 'buffer' })

      const imageData = await this.getImageDataFromPng(imgResponse.body)

      const imageUint8 = new Uint8ClampedArray(
        imageData.data,
        imageData.data.byteOffset,
        imageData.data.byteLength
      )

      var code = jsQR(imageUint8, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code === null) {
        return response.unprocessableEntity('Unable to decode QR code')
      }

      return code.data
    } catch (error) {
      return response.unprocessableEntity('Unable to decode QR code')
    }
  }

  public async getImageDataFromPng(
    fileBuffer: ArrayBuffer
  ): Promise<{ data: Buffer; width: number; height: number }> {
    return new Promise(async (resolve, reject) => {
      let png = new PNG({ filterType: 4 })

      png.parse(fileBuffer, (error, data) => {
        if (error) {
          reject()
        }

        resolve(data)
      })
    })
  }
}

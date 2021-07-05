import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DecoderValidator from 'App/Validators/DecoderValidator'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import got from 'got'
import FileType from 'file-type'
import ImageData from 'App/Models/ImageData'
import jpeg from 'jpeg-js'

export default class DecodesController {
  public async index({ request, response }: HttpContextContract) {
    const { fileurl } = await request.validate(DecoderValidator)

    const imgResponse = await got(fileurl, { responseType: 'buffer' })

    if (imgResponse.statusCode !== 200) {
      return response.unprocessableEntity('Unable to decode QR code')
    }

    const fileType = await FileType.fromBuffer(imgResponse.body)

    if (!fileType?.mime) {
      return response.unprocessableEntity('Unable to decode QR code')
    }

    const imageData = await this.getImageDataFromBuffer(imgResponse.body, fileType?.mime)

    if (!imageData?.data) {
      return response.unprocessableEntity('Unable to decode QR code')
    }

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
  }

  public async getImageDataFromBuffer(fileBuffer: ArrayBuffer, mime: string): Promise<ImageData> {
    return new Promise(async (resolve, reject) => {
      if (mime === 'image/jpeg') {
        resolve(jpeg.decode(fileBuffer))
      } else if (mime === 'image/png') {
        let png = new PNG({ filterType: 4 })

        png.parse(fileBuffer, (error: unknown, data: ImageData) => {
          if (error) {
            reject()
          }

          resolve(data)
        })
      } else {
        reject()
      }
    })
  }
}

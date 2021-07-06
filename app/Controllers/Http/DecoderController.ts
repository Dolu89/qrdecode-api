import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DecoderValidator from 'App/Validators/DecoderValidator'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import axios, { AxiosResponse } from 'axios'
import FileType from 'file-type'
import ImageData from 'App/Models/ImageData'
import jpeg from 'jpeg-js'
import { decode } from '@node-lightning/invoice'
import { createHash } from 'crypto'
import Env from '@ioc:Adonis/Core/Env'

export default class DecodesController {
  public async index({ request, response }: HttpContextContract) {
    const { invoice, preimage } = await request.validate(DecoderValidator)

    const decodedInvoice = decode(invoice)
    const paymentHash = decodedInvoice.paymentHash.toString('hex')

    let invoiceResult: AxiosResponse<{ paid: boolean; preimage: string }>
    try {
      invoiceResult = await axios.get(`${Env.get('LNBITS_HOST')}/api/v1/payments/${paymentHash}`, {
        headers: {
          'X-Api-Key': Env.get('LNBITS_API_KEY'),
        },
      })
    } catch (error) {
      return response.notFound('Invoice not found')
    }

    if (!invoiceResult.data.paid) {
      return response.paymentRequired(`Payment required: ${invoice}`)
    }
    if (paymentHash !== createHash('sha256').update(Buffer.from(preimage, 'hex')).digest('hex')) {
      return response.paymentRequired(
        `Proof of payment (preimage) is not correct for invoice: ${invoice}`
      )
    }

    let imgResponse: AxiosResponse<any>
    try {
      imgResponse = await axios.get(decodedInvoice.desc.toString(), {
        responseType: 'arraybuffer',
      })
    } catch (error) {
      return response.unprocessableEntity('A problem occured while fetching file url')
    }

    const fileType = await FileType.fromBuffer(imgResponse.data)

    if (!fileType?.mime) {
      return response.unprocessableEntity('A problem occured while getting MIME type')
    }

    const imageData = await this.getImageDataFromBuffer(imgResponse.data, fileType?.mime)

    if (!imageData?.data) {
      return response.unprocessableEntity('Only PNG or JPG are allowed')
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

    return { data: code.data }
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

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import InvoiceValidator from 'App/Validators/InvoiceValidator'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export default class InvoicesController {
  public async index({ request }: HttpContextContract) {
    const { fileurl } = await request.validate(InvoiceValidator)

    await axios
      .post(
        `${Env.get('LNBITS_HOST')}/api/v1/payments`,
        { out: false, amount: 1, memo: fileurl },
        {
          headers: {
            'X-Api-Key': Env.get('LNBITS_API_KEY'),
          },
        }
      )
      .catch((e) => console.error(e))
  }
}

import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class InvoiceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    fileurl: schema.string({ trim: true }),
  })

  public messages = {}
}

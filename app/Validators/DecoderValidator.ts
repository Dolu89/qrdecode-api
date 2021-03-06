import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class DecoderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    invoice: schema.string({ trim: true, escape: true }),
    preimage: schema.string({ trim: true, escape: true }),
  })

  public messages = {}
}

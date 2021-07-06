import Route from '@ioc:Adonis/Core/Route'

Route.get('/', () => {
  return 'QR(de)code api monetized by LN'
})
Route.post('/decode', 'DecoderController.index')
Route.post('/invoice', 'InvoicesController.index')

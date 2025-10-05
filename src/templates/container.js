import { navbar } from './navbar'

export const container = () =>
  [
    navbar(),
    [
      'div.container-fluid',
      [
        'div.box>div.content#main',
        ['h1.title', 'Loading...']
      ]
    ]
  ]

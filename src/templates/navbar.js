export const navbar = () =>
  [
    'nav.navbar',
    { role: 'navigation', 'aria-label': 'main navigation' },
    [
      'div.navbar-brand',
      [
        'a.navbar-item',
        { href: '#' },
        '🌹 [PDX-DSA] Admin Panel'
      ]
    ],
    [
      'div.navbar-menu',
      [
        'div.navbar-start',
        ['div.navbar-item>a', { href: '#bodies' }, '🤝 Chapter Bodies'],
        ['div.navbar-item>a', { href: '#members' }, '😤 Chapter Members']
      ],
      [
        'div.navbar-end',
        [
          'div.navbar-item>div.field>div.control',
          ['input.input', { type: 'text', placeholder: '🔍 Search members' }]
        ],
        ['div.navbar-item>a', { href: '#account' }, '🫡 Your Account']
      ]
    ]
  ]

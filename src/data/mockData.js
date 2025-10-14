// Mock Data - Datos de prueba para la aplicación

export const mockOrders = {
  recibidos: [
    {
      id: '00125',
      client: 'Carlos López',
      phone: '555-123-4567',
      totalPrice: 750,
      deliveryDate: 'Entrega: 10 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 300,
      paymentMethod: 'transfer',
      generalNotes: 'Cliente frecuente, importante mantener calidad alta',
      shoePairs: [
        {
          id: 'pair-001',
          model: 'Jordan 1 Retro High',
          service: 'Restauración Completa',
          price: 400,
          status: 'pending',
          images: ['/tenis.png', '/tenis.png'],
          notes: 'Revisar suela, tiene desgaste importante'
        },
        {
          id: 'pair-002',
          model: 'Nike Air Force 1',
          service: 'Lavado Profundo',
          price: 250,
          status: 'pending',
          images: ['/tenis.png'],
          notes: 'Cliente quiere que queden blancos impecables'
        },
        {
          id: 'pair-003',
          model: 'Adidas Yeezy Boost 350',
          service: 'Lavado Express',
          price: 100,
          status: 'pending',
          images: ['/tenis.png', '/tenis.png', '/tenis.png'],
          notes: ''
        }
      ]
    },
    {
      id: '00130',
      client: 'Laura Mendoza',
      phone: '555-789-0123',
      totalPrice: 500,
      deliveryDate: 'Entrega: 12 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 500,
      paymentMethod: 'cash',
      shoePairs: [
        {
          id: 'pair-004',
          model: 'Reebok Club C',
          service: 'Lavado Básico',
          price: 150,
          status: 'pending',
          images: ['/tenis.png', '/tenis.png'],
          notes: 'Cuidado con la parte de cuero'
        },
        {
          id: 'pair-005',
          model: 'Puma Suede Classic',
          service: 'Lavado Profundo',
          price: 250,
          status: 'pending',
          images: ['/tenis.png'],
          notes: 'Tiene manchas difíciles en la gamuza'
        },
        {
          id: 'pair-006',
          model: 'Vans Sk8-Hi',
          service: 'Lavado Express',
          price: 100,
          status: 'pending',
          images: [],
          notes: ''
        }
      ]
    },
    {
      id: '00135',
      client: 'Miguel Ángel',
      phone: '555-456-7890',
      totalPrice: 450,
      deliveryDate: 'Entrega: Mañana',
      priority: 'high',
      dateClass: 'urgent',
      advancePayment: 0,
      paymentMethod: 'pending',
      generalNotes: 'URGENTE - Cliente necesita para evento mañana',
      shoePairs: [
        {
          id: 'pair-007',
          model: 'Nike Dunk Low',
          service: 'Lavado Express',
          price: 100,
          status: 'pending',
          images: ['/tenis.png'],
          notes: 'Prioridad máxima'
        },
        {
          id: 'pair-008',
          model: 'Air Jordan 4',
          service: 'Restauración Completa',
          price: 350,
          status: 'pending',
          images: ['/tenis.png', '/tenis.png'],
          notes: 'Restaurar malla lateral y repintar detalles'
        }
      ]
    },
    {
      id: '00136',
      client: 'Sandra Rivera',
      phone: '555-321-6540',
      totalPrice: 250,
      deliveryDate: 'Entrega: 15 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 100,
      paymentMethod: 'card',
      shoePairs: [
        {
          id: 'pair-009',
          model: 'Adidas Stan Smith',
          service: 'Lavado Profundo',
          price: 250,
          status: 'pending',
          images: [],
          notes: 'Cliente pidió servicio premium'
        }
      ]
    }
  ],
  proceso: [
    {
      id: '00124',
      client: 'María García',
      phone: '098-765-4321',
      totalPrice: 650,
      deliveryDate: 'Entrega: 8 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 300,
      paymentMethod: 'transfer',
      shoePairs: [
        {
          id: 'pair-010',
          model: 'Adidas Superstar',
          service: 'Lavado Básico',
          price: 150,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-011',
          model: 'Nike Cortez',
          service: 'Restauración',
          price: 350,
          status: 'in-progress',
          images: ['/tenis.png'],
          notes: 'Trabajando en la restauración de suela'
        },
        {
          id: 'pair-012',
          model: 'Converse All Star',
          service: 'Lavado Express',
          price: 150,
          status: 'pending',
          images: ['/tenis.png', '/tenis.png'],
          notes: ''
        }
      ]
    },
    {
      id: '00127',
      client: 'Luis Ramírez',
      phone: '555-246-8135',
      totalPrice: 900,
      deliveryDate: 'Entrega: Mañana',
      priority: '',
      dateClass: 'soon',
      advancePayment: 900,
      paymentMethod: 'cash',
      generalNotes: 'Colección especial del cliente',
      shoePairs: [
        {
          id: 'pair-013',
          model: 'Vans Old Skool',
          service: 'Lavado Profundo',
          price: 250,
          status: 'completed',
          images: ['/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-014',
          model: 'Nike SB Dunk',
          service: 'Restauración Completa',
          price: 400,
          status: 'in-progress',
          images: ['/tenis.png', '/tenis.png'],
          notes: 'Falta repintar swoosh'
        },
        {
          id: 'pair-015',
          model: 'Adidas Gazelle',
          service: 'Lavado Profundo',
          price: 250,
          status: 'in-progress',
          images: ['/tenis.png'],
          notes: ''
        }
      ]
    },
    {
      id: '00132',
      client: 'Sofía Torres',
      phone: '555-159-7530',
      totalPrice: 850,
      deliveryDate: 'Entrega: 11 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 400,
      paymentMethod: 'card',
      shoePairs: [
        {
          id: 'pair-016',
          model: 'Air Force 1',
          service: 'Restauración',
          price: 350,
          status: 'in-progress',
          images: ['/tenis.png', '/tenis.png', '/tenis.png'],
          notes: 'En proceso de repintado'
        },
        {
          id: 'pair-017',
          model: 'Jordan 11 Retro',
          service: 'Restauración Completa',
          price: 500,
          status: 'pending',
          images: ['/tenis.png'],
          notes: 'Requiere restauración de suela transparente'
        }
      ]
    }
  ],
  listos: [
    {
      id: '00123',
      client: 'Juan Pérez',
      phone: '123-456-7890',
      totalPrice: 600,
      deliveryDate: 'Entrega: Hoy',
      priority: 'high',
      dateClass: 'urgent',
      advancePayment: 300,
      paymentMethod: 'transfer',
      generalNotes: 'Cliente viene a recoger hoy en la tarde',
      shoePairs: [
        {
          id: 'pair-018',
          model: 'Nike Air Max 90',
          service: 'Lavado Profundo',
          price: 250,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-019',
          model: 'Nike Air Max 95',
          service: 'Restauración',
          price: 350,
          status: 'completed',
          images: ['/tenis.png'],
          notes: 'Restauración de burbujas completada'
        }
      ]
    },
    {
      id: '00126',
      client: 'Ana Martínez',
      phone: '555-987-6543',
      totalPrice: 800,
      deliveryDate: 'Entrega: Hoy',
      priority: 'high',
      dateClass: 'urgent',
      advancePayment: 400,
      paymentMethod: 'card',
      shoePairs: [
        {
          id: 'pair-020',
          model: 'Puma RS-X',
          service: 'Lavado Express',
          price: 100,
          status: 'completed',
          images: ['/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-021',
          model: 'New Balance 990',
          service: 'Lavado Profundo',
          price: 250,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-022',
          model: 'Asics Gel-Kayano',
          service: 'Restauración Completa',
          price: 450,
          status: 'completed',
          images: ['/tenis.png'],
          notes: 'Restauración perfecta según estándares'
        }
      ]
    },
    {
      id: '00128',
      client: 'Patricia Sánchez',
      phone: '555-369-2580',
      totalPrice: 550,
      deliveryDate: 'Entrega: Hoy',
      priority: 'high',
      dateClass: 'urgent',
      advancePayment: 550,
      paymentMethod: 'cash',
      shoePairs: [
        {
          id: 'pair-023',
          model: 'Converse Chuck Taylor',
          service: 'Lavado Básico',
          price: 150,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png', '/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-024',
          model: 'Converse Chuck 70',
          service: 'Restauración',
          price: 400,
          status: 'completed',
          images: ['/tenis.png'],
          notes: 'Repintado de suela completado'
        }
      ]
    },
    {
      id: '00133',
      client: 'Fernando Cruz',
      phone: '555-147-8520',
      totalPrice: 150,
      deliveryDate: 'Entrega: Mañana',
      priority: '',
      dateClass: 'soon',
      advancePayment: 0,
      paymentMethod: 'pending',
      shoePairs: [
        {
          id: 'pair-025',
          model: 'Asics Gel-Lyte III',
          service: 'Lavado Básico',
          price: 150,
          status: 'completed',
          images: [],
          notes: ''
        }
      ]
    },
    {
      id: '00134',
      client: 'Isabel Ramos',
      phone: '555-753-9510',
      totalPrice: 1100,
      deliveryDate: 'Entrega: 8 Oct',
      priority: '',
      dateClass: '',
      advancePayment: 500,
      paymentMethod: 'transfer',
      generalNotes: 'Colección completa de la cliente, manejo especial',
      shoePairs: [
        {
          id: 'pair-026',
          model: 'Saucony Shadow',
          service: 'Lavado Profundo',
          price: 250,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-027',
          model: 'Saucony Jazz',
          service: 'Restauración',
          price: 350,
          status: 'completed',
          images: ['/tenis.png'],
          notes: ''
        },
        {
          id: 'pair-028',
          model: 'Nike Pegasus',
          service: 'Restauración Completa',
          price: 500,
          status: 'completed',
          images: ['/tenis.png', '/tenis.png'],
          notes: 'Restauración vintage perfecta'
        }
      ]
    }
  ]
};

export const mockServices = [
  {
    id: '1',
    name: 'Lavado Básico',
    description: 'Limpieza exterior del calzado',
    price: 150,
    duration: 2,
    active: true
  },
  {
    id: '2',
    name: 'Lavado Profundo',
    description: 'Limpieza completa interior y exterior',
    price: 250,
    duration: 3,
    active: true
  },
  {
    id: '3',
    name: 'Lavado Express',
    description: 'Limpieza rápida en 24 horas',
    price: 100,
    duration: 1,
    active: true
  },
  {
    id: '4',
    name: 'Restauración',
    description: 'Reparación y restauración de detalles',
    price: 350,
    duration: 5,
    active: true
  },
  {
    id: '5',
    name: 'Restauración Completa',
    description: 'Restauración total del calzado',
    price: 400,
    duration: 7,
    active: true
  }
];

export const mockClients = [
  {
    id: '1',
    name: 'Carlos López',
    phone: '555-123-4567',
    email: 'carlos@example.com',
    orders: 5
  },
  {
    id: '2',
    name: 'Laura Mendoza',
    phone: '555-789-0123',
    email: 'laura@example.com',
    orders: 3
  },
  {
    id: '3',
    name: 'Miguel Ángel',
    phone: '555-456-7890',
    email: 'miguel@example.com',
    orders: 2
  }
];

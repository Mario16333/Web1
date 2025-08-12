# GameStore - Tienda de Productos Gaming

Una página web moderna y responsive para vender productos de gaming, creada con HTML, CSS y JavaScript.

## 🎮 Características

### Diseño y UX
- **Diseño moderno y atractivo** con gradientes y animaciones
- **Totalmente responsive** - funciona en móviles, tablets y desktop
- **Navegación suave** con scroll automático
- **Efectos visuales** como hover, animaciones y transiciones
- **Tema gaming** con colores vibrantes y iconos temáticos

### Funcionalidades
- **Catálogo de productos** con imágenes y precios
- **Carrito de compras** funcional con modal
- **Gestión de cantidades** en el carrito
- **Sección de ofertas especiales** con descuentos
- **Newsletter** para suscripciones
- **Navegación por categorías** (Consolas, Monitores, Audio, Periféricos)

### Características Técnicas
- **HTML5 semántico** para mejor SEO
- **CSS3 avanzado** con Grid, Flexbox y animaciones
- **JavaScript vanilla** sin dependencias externas
- **Optimizado para rendimiento** con lazy loading
- **Accesible** con navegación por teclado

## 📁 Estructura del Proyecto

```
gamestore/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Funcionalidad JavaScript
└── README.md           # Documentación
```

## 🚀 Cómo Usar

1. **Abrir la página**: Simplemente abre `index.html` en tu navegador
2. **Navegar**: Usa el menú superior para ir a diferentes secciones
3. **Ver productos**: Explora el catálogo en la sección "Productos Destacados"
4. **Añadir al carrito**: Haz clic en "Añadir al Carrito" en cualquier producto
5. **Ver carrito**: Haz clic en el icono del carrito en la barra de navegación
6. **Finalizar compra**: En el carrito, haz clic en "Finalizar Compra"

## 🎨 Secciones de la Página

### Header
- Logo y nombre de la tienda
- Menú de navegación
- Icono del carrito con contador

### Hero Section
- Título principal con gradiente
- Descripción de la tienda
- Botón call-to-action
- Iconos flotantes animados

### Categorías
- 4 categorías principales con iconos
- Efectos hover atractivos
- Diseño en grid responsive

### Productos
- Catálogo dinámico cargado con JavaScript
- Tarjetas de producto con imágenes
- Precios y botones de compra
- Animaciones de entrada

### Ofertas
- Productos con descuentos especiales
- Badges de descuento
- Precios originales y rebajados

### Newsletter
- Formulario de suscripción
- Diseño atractivo con gradiente
- Validación de email

### Footer
- Información de contacto
- Enlaces a redes sociales
- Enlaces de navegación
- Información legal

## 🛒 Funcionalidades del Carrito

- **Añadir productos**: Desde cualquier sección de productos
- **Gestionar cantidades**: Botones + y - en el carrito
- **Eliminar productos**: Botón × para cada item
- **Cálculo automático**: Total actualizado en tiempo real
- **Notificaciones**: Mensajes de confirmación al añadir productos
- **Modal responsive**: Carrito que se abre en una ventana modal

## 📱 Responsive Design

La página está optimizada para:
- **Móviles** (320px - 768px)
- **Tablets** (768px - 1024px)
- **Desktop** (1024px+)

### Adaptaciones móviles:
- Menú hamburguesa para navegación
- Grid de productos en una columna
- Modal de carrito optimizado
- Textos y botones redimensionados

## 🎯 Productos Incluidos

### Consolas
- PlayStation 5 - €499
- Xbox Series X - €499
- Nintendo Switch OLED - €349

### Monitores
- Monitor Gaming 27" 144Hz - €299

### Audio
- Auriculares Gaming Pro - €89
- Micrófono Streaming - €149

### Periféricos
- Teclado Mecánico RGB - €129
- Ratón Gaming Wireless - €79

## 🔧 Personalización

### Cambiar Productos
Edita el array `productos` en `script.js`:

```javascript
const productos = [
    {
        id: 1,
        nombre: "Tu Producto",
        precio: 99,
        imagen: "ruta/a/tu/imagen.jpg",
        categoria: "Tu Categoría"
    }
    // ... más productos
];
```

### Cambiar Colores
Modifica las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #ff6b6b;
    --secondary-color: #4ecdc4;
    --gradient-primary: linear-gradient(45deg, #ff6b6b, #ee5a24);
    --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Añadir Categorías
Edita la sección de categorías en `index.html` y actualiza el CSS correspondiente.

## 🌟 Características Avanzadas

- **Lazy Loading**: Las imágenes se cargan solo cuando son visibles
- **Parallax Effect**: Efecto de profundidad en el hero section
- **Smooth Scrolling**: Navegación suave entre secciones
- **Animaciones CSS**: Transiciones y keyframes personalizados
- **Local Storage**: El carrito se mantiene entre sesiones (futura implementación)

## 📞 Contacto

Para soporte o preguntas:
- Email: info@gamestore.es
- Teléfono: +34 900 123 456
- Dirección: Madrid, España

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

¡Disfruta explorando GameStore! 🎮✨ 
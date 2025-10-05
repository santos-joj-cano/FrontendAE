// src/app/pages/dashboard/dashboard.ts

import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { InventarioService } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import { RouterOutlet, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // 👈 Importa este módulo

interface Producto {
  productoId: number;
  nombre: string;
  descripcion: string;
  estado: string;
  stock: number;
  precioAdquisicion: number;
  precioVenta: number;
  imagenUrl: string;
  sku: string;
  categoriaId: number;
}

interface NavItem {
  name: string;
  routerLink: string;
  iconName: string;
  roles: string[]; // <-- IMPORTANTE: Los roles que pueden ver este enlace
  separator?: string; // Para títulos de sección
}

// 💡 Lista completa de toda la navegación del sistema
const fullNavigation: NavItem[] = [
  // Enlaces principales
  {
    name: 'Caja',
    routerLink: 'caja',
    iconName: 'landmark',
    roles: ['Admin'],
  },
  {
    name: 'Compras',
    routerLink: 'compras',
    iconName: 'shopping-basket',
    roles: ['Admin'],
  },
  {
    name: 'Historial de ventas',
    routerLink: 'historial-ventas',
    iconName: 'percent',
    roles: ['Admin', 'Empleado'],
  },
  {
    name: 'Proveedores',
    routerLink: 'proveedores',
    iconName: 'warehouse',
    roles: ['Admin'],
  },
  {
    name: 'Ventas',
    routerLink: 'ventas',
    iconName: 'pencil-ruler',
    roles: ['Admin', 'Empleado'],
  },

  // Separador de Ajustes
  {
    name: 'Ajustes',
    routerLink: '',
    iconName: '',
    roles: ['Admin'],
    separator: 'Ajustes del sistema',
  },

  // Enlaces de ajustes del sistema (típicamente solo para Admin o Roles de Gerencia)
  {
    name: 'Categoría Productos',
    routerLink: 'categoria-producto',
    iconName: 'package-search',
    roles: ['Admin', 'Empleado'],
  },
  {
    name: 'Categoría Proveedores',
    routerLink: 'categoria-proveedor',
    iconName: 'package',
    roles: ['Admin'],
  },
  {
    name: 'Movimiento caja',
    routerLink: 'movimiento-caja',
    iconName: 'hand-coins',
    roles: ['Admin', 'Cajero'],
  },
  {
    name: 'Productos',
    routerLink: 'productos',
    iconName: 'database',
    roles: ['Admin', 'JefeCompras'],
  },
  {
    name: 'Reportes',
    routerLink: 'reportes',
    iconName: 'chart-area',
    roles: ['Admin'],
  },
  {
    name: 'Roles',
    routerLink: 'roles',
    iconName: 'user-lock',
    roles: ['Admin'],
  },
  {
    name: 'Sesiones de caja',
    routerLink: 'caja-sesion',
    iconName: 'inbox',
    roles: ['Admin'],
  },
  {
    name: 'Usuarios',
    routerLink: 'usuarios',
    iconName: 'users',
    roles: ['Admin'],
  },
];
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Dashboard implements OnInit {
  // Define una propiedad para el rol base y la navegación filtrada
  userRole: string = ''; // 'Admin' o 'Empleado'
  navigation: NavItem[] = [];
  routeBase: string = ''; // /admin/dashboard o /employee/dashboard

  //Current User
  currentUserName: string | null = null;

  isAdministrationOpen: boolean = false;
  isAdmin: boolean = false;
  isSidebarOpen: boolean = false; // estado del sidebar
  isChangePasswordModalOpen = false; // dialog

  actualPassword: string = '';
  newPassword: string = '';
  validationErrors: string[] = [];

  // Productos
  // ✅ Lista de productos con inventario bajo
  productosConstockBajo: Producto[] = [];
  // ✅ Puntos de control de stock
  readonly lowstockThresholds: number[] = [50, 25, 13, 5, 2];
  notificaciones: { id: number; titulo: string; mensaje: string }[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private inventarioService: InventarioService,
    private router: Router
  ) {}

  // ngOnInit(): void {
  //   this.authService.userRole$.subscribe((role) => {
  //     this.isAdmin = role === 'Admin';
  //   });
  //   this.currentUserName = this.authService.getCurrentUserName();

  //   // this.checkLowstock();

  //   // Programar notificaciones recurrentes
  //   this.programarNotificaciones();
  // }
  ngOnInit(): void {
    // 1. OBTENER EL ROL SINCRÓNICAMENTE al inicio
    const userRoleValue = this.authService.getUserRole();
    if (userRoleValue) {
      this.userRole = userRoleValue; // 👈 Asignar el rol a la propiedad
    }

    // 2. INICIALIZAR LA NAVEGACIÓN
    this.setupNavigation(); // 👈 Llamar a la función que usa this.userRole

    // 3. (Opcional) Mantener la suscripción para reactividad futura si la necesitas
    this.authService.userRole$.subscribe((role) => {
      this.isAdmin = role === 'Admin';
    });

    this.currentUserName = this.authService.getCurrentUserName();
    this.programarNotificaciones();
  }

  setupNavigation(): void {
    const role = this.userRole;

    if (!role) {
      this.navigation = [];
      return;
    }

    // 1. Establecer la ruta base (prefijo para los enlaces del sidebar)
    if (role === 'Admin') {
      this.routeBase = '/admin/dashboard';
    } else if (role === 'Empleado') {
      // Asumo que tus rutas para empleado comienzan en /employee/dashboard
      this.routeBase = '/employee/dashboard';
    } else {
      this.routeBase = '/'; // Fallback seguro
    }

    // 2. Filtrar la navegación: solo mantiene los ítems que incluyen el rol del usuario
    this.navigation = fullNavigation.filter((item) =>
      item.roles.includes(role)
    );
  }

  // 1. Variable para controlar el estado del menú (abierto/cerrado)
  isOpen: boolean = false;

  checkLowstock(): void {
    this.inventarioService.getInventario().subscribe({
      next: (data: Producto[]) => {
        const nuevosProductos = data.filter((product) =>
          this.lowstockThresholds.some(
            (threshold) => product.stock <= threshold
          )
        );

        // Ordenar de menor a mayor stock
        nuevosProductos.sort((a, b) => a.stock - b.stock);

        // ---------------------------
        // 🔔 Notificación inmediata
        // ---------------------------
        nuevosProductos.forEach((p) => {
          const yaExiste = this.notificaciones.some(
            (n) => n.id === p.productoId
          );
          if (!yaExiste) {
            const nuevaNotificacion = {
              id: p.productoId,
              titulo: `Alerta: ${p.nombre}`,
              mensaje: this.getLowstockMessage(p),
            };

            this.notificaciones.push(nuevaNotificacion);

            // ✅ Programar auto-cierre a 1 minuto
            setTimeout(() => this.cerrarNotificacion(p.productoId), 60 * 1000);
          }
        });

        this.productosConstockBajo = nuevosProductos;
      },
      error: (err) => {
        console.error('Error al obtener el inventario:', err);
      },
    });
  }
  /**
   * Genera el mensaje de alerta para un producto específico.
   * @param producto El producto con bajo stock.
   * @returns El string del mensaje de alerta.
   */
  getLowstockMessage(producto: Producto): string {
    const stock = producto.stock;

    if (stock === 0) {
      return '¡stock AGOTADO! 😱 **Añadir a la orden de compra.**';
    }
    if (stock === 1) {
      return '¡PELIGRO! Queda **1** unidad. 🚨 **Se debe reponer inmediatamente.**';
    }

    // 1. Encontrar el umbral más bajo que el stock ha cruzado
    const lowestCrossedThreshold = this.lowstockThresholds
      .filter((t) => stock <= t)
      .sort((a, b) => a - b)[0]; // Tomar el primer elemento (el más bajo/crítico)

    if (stock === lowestCrossedThreshold) {
      // Si el stock coincide exactamente con el umbral crítico (ej: stock 5, umbral 5)
      return `¡Alerta de stock! Quedan exactamente **${stock}** unidades.`;
    }

    // Si el stock es más bajo que el umbral crítico (ej: stock 4, umbral crítico 5)
    if (stock < lowestCrossedThreshold) {
      // Si el stock está entre 2 y 50, se categoriza como crítico.
      // El "lowestCrossedThreshold" nos asegura que ya ha pasado la marca de control.
      return `¡stock crítico! Quedan **${stock}** unidades. (Pasó la marca de ${lowestCrossedThreshold})`;
    }

    // Caso por defecto (cubre stocks como 49, que está por debajo del umbral 50,
    // pero aún no es "crítico" si tienes umbrales más bajos)
    return `Quedan ${stock} unidades.`;
  }

  removeLowstockProduct(productId: number): void {
    this.productosConstockBajo = this.productosConstockBajo.filter(
      (p) => p.productoId !== productId
    );
  }

  cerrarNotificacion(id: number): void {
    this.notificaciones = this.notificaciones.filter((n) => n.id !== id);
    this.removeLowstockProduct(id); // tu lógica ya borra el producto de la lista de stock bajo
  }

  // programarNotificaciones(): void {
  //   const mostrarNotificacion = () => {
  //     this.checkLowstock(); // refresca productos
  //     if (this.notificaciones.length > 0) {
  //       console.log('🔔 Mostrando notificaciones de stock bajo');
  //     }
  //   };

  //   const revisarYMostrar = () => {
  //     const ahora = new Date();
  //     const hora = ahora.getHours();
  //     const minutos = ahora.getMinutes();

  //     // Verificar si estamos exactamente en 10:00 o 13:00
  //     if ((hora === 10 || hora === 13) && minutos === 0) {
  //       // Verificar si toca el ciclo de cada 3 días
  //       const ultimo = localStorage.getItem('ultimoNotificacion');
  //       const hoy = new Date().toDateString();

  //       if (ultimo !== hoy) {
  //         const diasDesdeUltimo = ultimo
  //           ? Math.floor(
  //               (ahora.getTime() - new Date(ultimo).getTime()) /
  //                 (1000 * 60 * 60 * 24)
  //             )
  //           : 3;

  //         if (diasDesdeUltimo >= 3) {
  //           mostrarNotificacion();
  //           localStorage.setItem('ultimoNotificacion', hoy);
  //         }
  //       }
  //     }
  //   };

  //   // Revisa cada minuto si se cumple la condición
  //   setInterval(revisarYMostrar, 60 * 1000);
  // }
  programarNotificaciones(): void {
    const mostrarNotificacion = () => {
      this.checkLowstock(); // refresca productos y llena this.notificaciones
      if (this.notificaciones.length > 0) {
        console.log('🔔 Mostrando notificaciones de stock bajo');
      }
    };

    const revisarYMostrar = () => {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();

      // ✅ Solo a las 10:00 o 14:00 en punto
      if ((hora === 10 || hora === 14) && minutos === 0) {
        const ultimo = localStorage.getItem('ultimoNotificacion');
        const hoy = new Date().toDateString();

        if (ultimo !== hoy) {
          // ⚡ Ahora es DIARIO, no cada 3 días
          mostrarNotificacion();
          localStorage.setItem('ultimoNotificacion', hoy);
        }
      }
    };

    // ✅ Revisa cada minuto si se cumple la condición
    setInterval(revisarYMostrar, 60 * 1000);
  }

  getCurrentUserName(): string | null {
    const token = this.getToken();

    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);

        // El nombre del usuario en tu payload se llama "unique_name"

        return decodedToken.unique_name;
      } catch (error) {
        console.error('Error decodificando el token:', error);

        return null;
      }
    }

    return null;
  }
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  toggleAdministrationMenu(): void {
    this.isAdministrationOpen = !this.isAdministrationOpen;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // -------------------------------------------------
  // Dialog handling
  // -------------------------------------------------
  openChangePasswordModal(): void {
    this.isSidebarOpen = false;
    this.isOpen = false;
    this.resetPasswordForm();
    this.isChangePasswordModalOpen = true;
  }

  closeChangePasswordModal(): void {
    this.isChangePasswordModalOpen = false;
  }

  private resetPasswordForm(): void {
    this.actualPassword = '';
    this.newPassword = '';
    this.validationErrors = [];
  }

  /** ✅ Validar y enviar la petición de cambio de contraseña */
  submitChangePassword(): void {
    this.validationErrors = [];

    // ------------------- VALIDACIONES -------------------
    if (!this.actualPassword.trim() || !this.newPassword.trim()) {
      this.validationErrors.push('Los dos campos son obligatorios.');
    }
    if (this.newPassword.length < 6) {
      this.validationErrors.push(
        'La nueva contraseña debe tener al menos 6 caracteres.'
      );
    }
    if (this.validationErrors.length) return;

    // ------------------- OBTENER ID --------------------
    let userId: number;
    try {
      userId = this.authService.getCurrentUserId(); // <-- ahora sí funciona
    } catch (e: any) {
      this.validationErrors.push(
        e.message ?? 'No se pudo obtener el ID del usuario.'
      );
      return;
    }

    // ------------------- PETICIÓN ----------------------
    this.userService
      .changePassword(userId, this.actualPassword, this.newPassword)
      .subscribe({
        next: () => {
          alert('Contraseña cambiada correctamente.');
          this.closeChangePasswordModal();
        },
        error: (err) => {
          console.error(err);
          const msg =
            err?.error?.message ?? 'No se pudo cambiar la contraseña.';
          this.validationErrors = [msg];
        },
      });
  }
}

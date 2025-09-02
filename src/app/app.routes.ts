import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard'; // Este componente contendrá el <router-outlet>
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { EmployeeLayout } from './layouts/employee-layout/employee-layout';
import { Roleandusers } from './pages/roleandusers/roleandusers';
import { Caja } from './pages/caja/caja';
import { Compras } from './pages/compras/compras';
import { Productos } from './pages/productos/productos';
import { Proveedores } from './pages/proveedores/proveedores';
import { Ventas } from './pages/ventas/ventas';
import { Reportes } from './pages/reportes/reportes';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Admin' },
    children: [
      {
        path: 'dashboard',
        component: Dashboard, // El Dashboard se convierte en el padre
        children: [
          { path: '', redirectTo: 'caja', pathMatch: 'full'}, // Redirección a la primera sub-página
          { path: 'caja', component: Caja }, // Se renderiza el componente Caja dentro del Dashboard
          { path: 'compras', component: Compras }, // Se renderiza el componente Compras dentro del Dashboard
          { path: 'productos', component: Productos }, // Se renderiza el componente Productos dentro del Dashboard
          { path: 'proveedores', component: Proveedores }, // Se renderiza el componente Proveedores dentro del Dashboard
          { path: 'ventas', component: Ventas }, // Se renderiza el componente Ventas dentro del Dashboard
          // Otras opciones
          { path: 'reportes', component: Reportes }, // Se renderiza el componente Roleandusers dentro del Dashboard
          { path: 'ajustes', component: Roleandusers }, // Se renderiza el componente Roleandusers dentro del Dashboard
          // { path: 'roles', component: RoleListComponent } // Para la lista de roles
        ]
      },
      // Agrega aquí otras rutas de nivel superior si es necesario (ej. /admin/reports)
    ]
  },
  {
    path: 'employee',
    component: EmployeeLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Empleado' },
    children: [
      { path: 'dashboard', component: Dashboard },
      // Agrega aquí todas las rutas específicas de Empleado
    ]
  },
  { path: '**', redirectTo: '/login' }
];
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
//import { environment } from '../../environments/environment.prod';

/**
 * Define una interfaz para la estructura de datos de un Proveedor (opcional, pero recomendado).
 * Ajusta los campos según la estructura real de tu backend.
 */
export interface Proveedor {
  id: number;
  nombre: string;
  // Añade aquí otros campos de Proveedor (ej: contacto, telefono, email, etc.)
  // contacto?: string; 
  // telefono?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  // 🔑 URL del endpoint para la entidad Proveedores.
  // Es muy probable que necesites cambiar 'Productos' por 'Proveedores' o similar.
  //private apiUrl = 'https://localhost:7182/api/Proveedores';
  private apiUrl = `${environment.apiUrl}/Proveedores`;
 // 🆕 Endpoint específico para la subida de imágenes de Proveedores
  // ASUME que el backend tiene un controlador Proveedores y un método SubirImagen
  private imageUploadUrl = 'https://localhost:7182/api/Proveedores/SubirImagen';

  constructor(private http: HttpClient) {}

  // 1. Obtiene todos los proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  // 2. Crea un nuevo proveedor
  createProveedor(proveedor: Omit<Proveedor, 'id'>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  // 3. Obtiene un proveedor por su ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // 4. Actualiza un proveedor existente
  updateProveedor(id: number, proveedor: Proveedor): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, proveedor);
  }

  // 5. Elimina un proveedor
  deleteProveedor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // 6. 🆕 Método específico para subir una imagen (usado en la creación)
  uploadImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    // ✅ CLAVE: 'image' debe coincidir con el nombre del parámetro del backend
    formData.append('image', imageFile, imageFile.name); 
    return this.http.post<any>(this.imageUploadUrl, formData);
  }

  // 7. 🆕 Método para actualizar la imagen de un proveedor existente (usado en la edición)
  /**
   * Actualiza la imagen de un proveedor específico.
   * @param id El ID del proveedor (asume que se llama 'proveedorId' en el frontend).
   * @param imageFile El archivo de la nueva imagen.
   * @returns Un Observable que representa la respuesta del backend.
   */
  updateProveedorImage(id: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    // ✅ CLAVE: 'image' debe coincidir con el nombre del parámetro del backend
    formData.append('image', imageFile, imageFile.name);

    // ✅ Llama al endpoint de tu backend que actualiza la imagen
    // ASUME que el endpoint para actualizar la imagen es: /api/Proveedores/ActualizarImagen/{id}
    return this.http.put(`${this.apiUrl}/ActualizarImagen/${id}`, formData);
  }
  // ❌ NOTA: Se han eliminado los métodos 'uploadImage' y 'updateProductImage'
  // por no ser relevantes en el CRUD básico de la entidad Proveedor.
}
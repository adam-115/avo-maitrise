import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

/**
 * Interface for a paginated response from the backend.
 * @template T The type of the data items in the array.
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // Current page number (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Interface for a generic search criteria object.
 * This can be extended by concrete services to define specific search fields.
 */
export interface SearchCriteria {
  // Example properties, can be any key-value pairs
  [key: string]: any;
}

/**
 * Abstract generic service for standard CRUD (Create, Read, Update, Delete) operations.
 * This service should be extended by concrete services for specific resources.
 *
 * @template T The type of the resource (e.g., User, Product, etc.).
 */
@Injectable({
  providedIn: 'root'
})
export abstract class AbstractCrudService<T> {

  /**
   * Protected base URL for the API endpoint of the resource.
   * Concrete services must provide this URL.
   * Example: 'http://localhost:8080/api/users'
   */
  protected abstract apiUrl: string;

  /**
   * Injects the HttpClient.
   * @param http The Angular HttpClient instance.
   */
  constructor(protected http: HttpClient) { }

  /**
   * Creates a new item on the backend.
   * @param item The item to create.
   * @returns An Observable of the created item.
   */
  create(item: T): Observable<T> {
    return this.http.post<T>(this.apiUrl, item);
  }

  /**
   * Updates an existing item on the backend.
   * @param id The ID of the item to update.
   * @param item The updated item data.
   * @returns An Observable of the updated item.
   */
  update(id: any, item: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${id}`, item);
  }

  /**
   * Finds an item by its ID.
   * @param id The ID of the item to find.
   * @returns An Observable of the found item.
   */
  findById(id: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  /**
   * Finds all items with pagination.
   * @param page The page number (0-indexed). Defaults to 0.
   * @param size The number of items per page. Defaults to 10.
   * @returns An Observable of a paginated response.
   */
  findAll(page: number = 0, size: number = 10): Observable<PaginatedResponse<T>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<T>>(this.apiUrl, { params });
  }

  /**
   * Searches for items based on a criteria object with pagination.
   *
   * This implementation uses a POST request with the criteria in the request body,
   * which is generally more flexible than using query parameters for complex objects.
   * Assumes the backend has an endpoint like '.../search' that accepts a search object.
   *
   * @param criteria The search criteria object.
   * @param page The page number (0-indexed). Defaults to 0.
   * @param size The number of items per page. Defaults to 10.
   * @returns An Observable of a paginated response.
   */
  searchByCriteria(
    criteria: SearchCriteria,
    page: number = 0,
    size: number = 10
  ): Observable<PaginatedResponse<T>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.post<PaginatedResponse<T>>(`${this.apiUrl}/search`, criteria, { params });
  }


  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.apiUrl);
  }

  /**
   * Deletes an item by its ID.
   * @param id The ID of the item to delete.
   * @returns An Observable of the response.
   */
  delete(id: any): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}

import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { IconType } from '../appTypes';



@Injectable({
  providedIn: 'root',
})
export class AlertService {


  // Alerte de succès rapide
  success(message: string) {
    Swal.fire({
      title: 'Succès !',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      heightAuto: false
    });
  }

  // Alerte de succès rapide
  displayMessage(title:string,message: string, icon:IconType ) {
    Swal.fire({
      titleText:title,
      position: "top-end",
      text: message,
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 1800,
      showCloseButton: true,
    });
  }

  // Confirmation de suppression stylée
  async confirmMessage(title:string,message:string , iconType:IconType): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: iconType,
      showCancelButton: true,
      confirmButtonColor: '#28a745',   // Rouge pour la suppression
      cancelButtonColor: '#3085d6',  // Bleu pour annuler
      confirmButtonText: 'Oui!',
      cancelButtonText: 'Annuler',
      reverseButtons: true,          // Met "Annuler" à gauche
      heightAuto: false,
      showCloseButton: true,
    });

    return result.isConfirmed;
  }

}

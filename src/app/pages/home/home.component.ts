import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  showPopup: boolean = false;
  popupType: 'edit' | 'delete' | 'notification' | '' = '';
  popupTitle: string = '';
  popupData: any = {};

  constructor(private auth: AuthService, private router: Router) {}

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('nav-active');
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  openPopup(type: 'edit' | 'delete' | 'notification', data: any = {}) {
    this.popupType = type;
    this.popupData = { ...data };
    this.popupTitle = {
      edit: 'Edit Item',
      delete: 'Confirm Delete',
      notification: 'Notification'
    }[type];
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.popupType = '';
    this.popupData = {};
  }

  confirmPopup() {
    switch (this.popupType) {
      case 'edit':
        // Implement edit logic
        console.log('Editing:', this.popupData);
        break;
      case 'delete':
        // Implement delete logic
        console.log('Deleting item');
        break;
      case 'notification':
        // Handle notification
        console.log('Notification acknowledged');
        break;
    }
    this.closePopup();
  }
}
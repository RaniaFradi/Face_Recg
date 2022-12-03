import { PredictionService } from './../prediction.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HttpClient } from '@angular/common/http';
import { LoadingController, Platform,AlertController, isPlatform, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { AuthenticationService } from './../services/authentication.service';


const APP_DIRECTORY = Directory.Data;

interface LocalFile {
  name: string;
  path: string;
  data: string;
}
 
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
  images: LocalFile[] = [];
  folderContent = [];
  currentFolder = '';
  copyFile = null;
  p: number;
  @ViewChild('filepicker') uploader: ElementRef;
 
  constructor(
    private route: ActivatedRoute, 
    private alertCtrl: AlertController, 
    private router: Router,
    private plt: Platform,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private authService: AuthenticationService,
    private predictService: PredictionService
    ) {}

  async ngOnInit() {
    this.currentFolder = this.route.snapshot.paramMap.get('folder') || '';
    this.loadDocuments();
  }


  async presentToast(text: string) {
    const toast = await this.toastCtrl.create({
      message: text,
      duration: 700,
    });
    toast.present();
  }



  async loadDocuments() {
    if (this.currentFolder != '') { 
      this.loadFiles();
    }
    const folderContent = await Filesystem.readdir({
      directory: APP_DIRECTORY,
      path: this.currentFolder
    });
  
    // The directory is just string
    this.folderContent = folderContent.files.map(images => {
      return {
        name: images}
    });
  
  }



  async createFolder() {
    let alert = await this.alertCtrl.create({
      header: 'Create folder',
      message: 'Please specify the name of the new user',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'User'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: async data => {
            await Filesystem.mkdir({
              directory: APP_DIRECTORY,
              path: `${''}/${data.name}`
            });
            this.loadDocuments();
            this.presentToast('User added successfully.');
          }
        }
      ]
    });
    await alert.present();
  }




  async folderClicked(entry) {
    let pathToOpen = entry.name;
    let folder = encodeURIComponent(pathToOpen);
    this.router.navigateByUrl(`/home/${folder}`);    
  }
  



  async loadFiles() {
    this.images = [];
    const loading = await this.loadingCtrl.create({
      message: 'Loading data...',
    });
    await loading.present();
 
    Filesystem.readdir({
      path: this.currentFolder,
      directory: APP_DIRECTORY,
    }).then(result => {
      this.loadFileData(result.files);
    },
    
    async (err) => {
      // empty
      await Filesystem.mkdir({
        path: this.currentFolder,
        directory: APP_DIRECTORY,
      });
    }

    ).then(_ => {
      loading.dismiss();
    });
  }
  


 
  // Get the actual base64 data of an image
  async loadFileData(fileNames: string[]) {
    for (let f of fileNames) {
      const filePath = `${this.currentFolder}/${f}`;
 
      const readFile = await Filesystem.readFile({
        path: filePath,
        directory: APP_DIRECTORY,
      });
 
      this.images.push({
        name: f,
        path: filePath,
        data: `data:image/jpeg;base64,${readFile.data}`,
      });
    }
  }
 
 
  async selectImage() {
    const image = await Camera.getPhoto({
        quality: 100,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos 
    });
 
    if (image) {
        this.saveImage(image)
    }
}



async saveImage(photo: Photo) {
  const base64Data = await this.readAsBase64(photo);

  const fileName = new Date().getTime() + '.jpeg';
  const savedFile = await Filesystem.writeFile({
      path: `${this.currentFolder}/${fileName}`,
      data: base64Data,
      directory: APP_DIRECTORY,
  });

  this.loadFiles();
  this.presentToast('Picture added successfully.');
}
  private async readAsBase64(photo: Photo) {
    if (this.plt.is('hybrid')) {
        const file = await Filesystem.readFile({
            path: photo.path
        });
 
        return file.data;
    }
    else {
        //Fetch the photo, read as a blob, then convert to base64 format
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
 
        return await this.convertBlobToBase64(blob) as string;
    }
}
 
convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});


async deleteImage(file: LocalFile) {
  await Filesystem.deleteFile({
      directory: APP_DIRECTORY,
      path: file.path
  });
  
  this.loadFiles();
  this.presentToast('Picture removed successfully.');
}

async delete(a) {
  await Filesystem.rmdir({
    directory: APP_DIRECTORY,
    path: this.currentFolder + '/' + a.name,
    recursive: true
  });

  this.loadDocuments();
  this.presentToast('User removed successfully.');
}
async logout() {
  await this.authService.logout();
  this.router.navigateByUrl('/', { replaceUrl: true });
}

async predict() {

  this.predictService.predict();

}
}
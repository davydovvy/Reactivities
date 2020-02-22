export interface IProfile {
   displayName: string,
   username: string,
   bio: string,
   image: string,
   photos: IPhoto[]
}

export interface IPhoto {
   id: string,
   url: string,
   isMain: boolean
}

export class ProfileFormValues implements IProfile {
   displayName: string = ''
   username: string = ''
   bio: string = ''
   image: string =''
   photos: IPhoto[] = []

   constructor(init? : IProfile) {
      Object.assign(this, init);
  }
}
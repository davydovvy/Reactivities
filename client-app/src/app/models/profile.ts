export interface IProfile {
   displayName: string,
   username: string,
   bio: string,
   image: string,
   following: boolean,
   followersCount: number,
   followingCount: number,
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
   following: boolean = false
   followersCount: number = 0
   followingCount: number = 0

   constructor(init? : IProfile) {
      Object.assign(this, init);
  }
}
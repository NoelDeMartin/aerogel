import { FileService } from './File';

export class FileMock extends FileService {

    public exists(): boolean {
        return false;
    }

    public getFiles(): string[] {
        return [];
    }

    public write(): void {
        //
    }

}

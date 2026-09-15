export default interface BaseFileInterface {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  size: number;
  encoding: string;
}

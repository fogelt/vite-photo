export { };

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: any,
        callback: (error: any, result: any) => void
      ) => {
        open: () => void;
      };
    };
  }
}
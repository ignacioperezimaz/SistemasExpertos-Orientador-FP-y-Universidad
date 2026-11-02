/// <reference types="vite/client" />

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module 'tau-prolog' {
  const pl: any;
  export default pl;
}

declare module 'tau-prolog/modules/lists.js' {
  const lists: (pl: any) => void;
  export default lists;
}

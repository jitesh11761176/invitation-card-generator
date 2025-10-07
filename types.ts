export interface Slide {
  title: string;
  content: string[];
}

export interface Presentation {
  slides: Slide[];
}

import {TypesetterRenderer} from "@/Renderer/TypesetterRenderer";
import {TextBox} from "@/TextBox";

interface TextBoxData {
  x: number;
  y: number;
  text: string;
}

export class TextBoxDataRenderer extends TypesetterRenderer{

  private textBoxes: TextBoxData[] = []

  renderTextBox(textBox: TextBox, x: number, y: number) {
    this.textBoxes.push({x: x + textBox.getShiftX(), y: y + textBox.getShiftY(), text: textBox.getText()})
  }

  getTextBoxes(): TextBoxData[] {
    return this.textBoxes;
  }
}
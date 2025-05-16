import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const ImageTextExtractor = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [qa, setQa] = useState({});

  const handleImageInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = () => {
    if (!image) return alert('Upload image');
    setLoading(true);
    Tesseract.recognize(image, 'eng')
      .then(({ data: { text } }) => setText(text))
      .catch(() => alert('Error extracting text'))
      .finally(() => setLoading(false));
  };

  const generateQnA = async (line, index) => {
    setQa(prev => ({ ...prev, [index]: 'Loading...' }));
    try {
     const res = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ENV_VARIABLE_OR_EMPTY_FOR_NOW',

    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: `generate a basic question and answer: "${line.trim()}"`
  }),
});

      const data = await res.json();
      const answer = data[0]?.generated_text || 'No response';
      const cleaned = answer.replace(/generate a basic question and answer:.*?\n?/i, '').trim();
      console.log(cleaned);
      setQa(prev => ({ ...prev, [index]:cleaned }));
    } catch {
      setQa(prev => ({ ...prev, [index]: 'Error generating Q&A' }));
    }
  };

  return (
    <div>
      <h1>Image Text Extractor & Q&A Generator</h1>
      <input type="file" accept="image/*" onChange={handleImageInput} />
      <button onClick={handleProcessImage} disabled={loading}>
        {loading ? 'Extracting Text...' : 'Extract Text'}
      </button>

      {image && <img src={image} alt="Preview" style={{ display: 'block', marginTop: '20px', maxHeight: '300px' }} />}

      {text && (
        <div>
          <h3>Extracted Text:</h3>
          <div>
            {text.split('\n').filter(line => line.trim()).map((line, index) => ( // ---> divide it into arrays and make it clean then store it in line
              <div key={index} style={{ marginBottom: 10 }}>{/* Give the lines key */}
                <p>{line}</p>
                <button onClick={() => generateQnA(line, index)}>Generate Q&A</button>
                {qa[index] && <p>{qa[index]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTextExtractor;

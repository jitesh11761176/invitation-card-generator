
import React from 'react';
import { Presentation } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { PresentationIcon } from './icons/PresentationIcon';

interface ResultDisplayProps {
  videoUrl: string | null;
  pptContent: Presentation | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ videoUrl, pptContent }) => {
  const downloadPptContent = () => {
    if (!pptContent) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(pptContent, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'invitation_presentation.json';
    link.click();
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Video Result */}
      {videoUrl && (
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <VideoIcon />
            Your Invitation Video
          </h2>
          <video controls className="w-full rounded-lg" key={videoUrl}>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* PPT Result */}
      {pptContent && (
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold flex items-center gap-2">
              <PresentationIcon />
              Presentation Content
            </h2>
            <button
              onClick={downloadPptContent}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
            >
              Download JSON
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {pptContent.slides.map((slide, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-lg">
                <h3 className="font-bold text-purple-400 text-lg">{slide.title}</h3>
                <ul className="list-disc list-inside mt-2 text-gray-300">
                  {slide.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;

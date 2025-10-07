
import React, { useState, useCallback, useEffect } from 'react';
import { Presentation } from './types';
import { generateInvitationVideo, generatePptContent, extractTextFromImage } from './services/geminiService';
import Loader from './components/Loader';
import ResultDisplay from './components/ResultDisplay';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { PhotographIcon } from './components/icons/PhotographIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { KeyIcon } from './components/icons/KeyIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';


// Helper function defined within App.tsx for simplicity
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove 'data:*/*;base64,' prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    eventCategory: 'Retirement',
    eventName: 'Felicitation Ceremony for Ramesh Kumar',
    recipientName: 'Ramesh Kumar',
    designation: '30 years of service to Kendriya Vidyalaya Sangathan',
    eventDate: 'Saturday, 30th August 2025',
    eventTime: '12pm onwards',
    eventVenue: 'Kendriya Vidyalaya, CRPF Jharoda Kalan, New Delhi - 110072',
    eventHost: 'The Kumar Family'
  });
  const [messageText, setMessageText] = useState("You are cordially invited to celebrate a journey of dedication. After years of hard work, it's time to bid a joyful adieu. Looking forward to celebrating with you.");
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [visualImages, setVisualImages] = useState<File[]>([]);
  
  const [loadingState, setLoadingState] = useState<{ isLoading: boolean; message: string }>({ isLoading: false, message: '' });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ videoUrl: string | null; pptContent: Presentation | null }>({ videoUrl: null, pptContent: null });

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsKeySaved(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey);
      localStorage.setItem('gemini_api_key', tempApiKey);
      setIsKeySaved(true);
      setError(null);
    } else {
      setError("API Key cannot be empty.");
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'messageText') {
      setMessageText(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'message' | 'visuals') => {
    if (e.target.files) {
      if (fileType === 'message') {
        setMessageFile(e.target.files[0]);
      } else {
        setVisualImages(Array.from(e.target.files));
      }
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!apiKey) {
      setError('Please set your Gemini API Key before generating.');
      return;
    }
    if (visualImages.length === 0) {
      setError('Please upload at least one image for the invitation visuals.');
      return;
    }

    setError(null);
    setResult({ videoUrl: null, pptContent: null });
    setLoadingState({ isLoading: true, message: 'Preparing your assets...'});

    try {
      let fullMessage = messageText;
      if (messageFile) {
        setLoadingState({ isLoading: true, message: 'Extracting text from message file...'});
        const messageImageBase64 = await fileToBase64(messageFile);
        const extractedText = await extractTextFromImage(apiKey, messageImageBase64);
        if (extractedText) {
          fullMessage = extractedText;
        }
      }

      setLoadingState({ isLoading: true, message: 'Generating presentation content...'});
      const pptContent = await generatePptContent(apiKey, { ...formData, message: fullMessage });
      setResult(prev => ({ ...prev, pptContent }));
      
      setLoadingState({ isLoading: true, message: 'Converting images for video generation...'});
      const visualImagesBase64 = await Promise.all(visualImages.map(fileToBase64));

      setLoadingState({ isLoading: true, message: 'Crafting your invitation video... This may take a few minutes.'});
      const videoUrl = await generateInvitationVideo(apiKey, { ...formData, message: fullMessage }, visualImagesBase64[0]); // Using the first image for the video
      if(videoUrl) {
         setResult(prev => ({ ...prev, videoUrl }));
      } else {
        throw new Error("Video generation failed to return a valid URL.");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoadingState({ isLoading: false, message: '' });
    }
  }, [apiKey, formData, messageText, messageFile, visualImages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-gray-200 font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            AI Invitation Generator
          </h1>
          <p className="mt-2 text-lg text-gray-400">Craft beautiful video & presentation invitations with Gemini</p>
        </header>

        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-8">
          {/* API Key Section */}
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-100 flex items-center gap-2">
              <KeyIcon />
              Gemini API Key
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="flex-grow w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
              <button
                onClick={handleSaveApiKey}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition"
              >
                Save
              </button>
            </div>
            {isKeySaved && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                <CheckCircleIcon />
                API Key is saved and ready to use.
              </p>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 border-b-2 border-purple-500 pb-2">1. Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
               <div className="md:col-span-2">
                <label htmlFor="eventName" className="block mb-2 text-sm font-medium text-gray-300">Event Name / Title</label>
                <input id="eventName" type="text" name="eventName" value={formData.eventName} onChange={handleInputChange} placeholder="e.g., Felicitation Ceremony for..." className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div>
                <label htmlFor="eventCategory" className="block mb-2 text-sm font-medium text-gray-300">Event Category</label>
                <select id="eventCategory" name="eventCategory" value={formData.eventCategory} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition">
                  <option>Retirement</option>
                  <option>Birthday</option>
                  <option>Wedding</option>
                  <option>Corporate</option>
                </select>
              </div>
              <div>
                <label htmlFor="recipientName" className="block mb-2 text-sm font-medium text-gray-300">Honoree / Subject Name</label>
                <input id="recipientName" type="text" name="recipientName" value={formData.recipientName} onChange={handleInputChange} placeholder="e.g., Ramesh Kumar" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="designation" className="block mb-2 text-sm font-medium text-gray-300">Achievement / Reason for Celebration</label>
                <input id="designation" type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g., 30 years of dedicated service" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div>
                <label htmlFor="eventDate" className="block mb-2 text-sm font-medium text-gray-300">Date</label>
                <input id="eventDate" type="text" name="eventDate" value={formData.eventDate} onChange={handleInputChange} placeholder="e.g., Saturday, 30th August 2025" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div>
                <label htmlFor="eventTime" className="block mb-2 text-sm font-medium text-gray-300">Time</label>
                <input id="eventTime" type="text" name="eventTime" value={formData.eventTime} onChange={handleInputChange} placeholder="e.g., 12pm onwards" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="eventVenue" className="block mb-2 text-sm font-medium text-gray-300">Venue</label>
                <input id="eventVenue" type="text" name="eventVenue" value={formData.eventVenue} onChange={handleInputChange} placeholder="e.g., Kendriya Vidyalaya, CRPF Jharoda Kalan" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="eventHost" className="block mb-2 text-sm font-medium text-gray-300">Hosted By</label>
                <input id="eventHost" type="text" name="eventHost" value={formData.eventHost} onChange={handleInputChange} placeholder="e.g., The Kumar Family" className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 border-b-2 border-purple-500 pb-2">2. Invitation Message</h2>
            <textarea name="messageText" value={messageText} onChange={handleInputChange} placeholder="Type your invitation message here..." rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"></textarea>
            <div className="text-center my-2 text-gray-400 font-semibold">OR</div>
             <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentTextIcon/>
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Upload message from a file</span> (PDF, DOCX, IMG)</p>
                    <p className="text-xs text-gray-500">{messageFile ? messageFile.name : 'No file chosen'}</p>
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'message')} />
            </label>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 border-b-2 border-purple-500 pb-2">3. Visuals</h2>
             <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotographIcon/>
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload images</span> for the invitation</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'visuals')} />
            </label>
            {visualImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {visualImages.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loadingState.isLoading || visualImages.length === 0 || !isKeySaved}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SparklesIcon/>
              {loadingState.isLoading ? 'Generating...' : 'Create Invitation'}
            </button>
          </div>
        </div>

        {error && (
            <div className="max-w-3xl mx-auto mt-8 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                <p><span className="font-bold">Error:</span> {error}</p>
            </div>
        )}

        {loadingState.isLoading && <Loader message={loadingState.message} />}
        
        {!loadingState.isLoading && (result.videoUrl || result.pptContent) && (
          <ResultDisplay videoUrl={result.videoUrl} pptContent={result.pptContent} />
        )}

      </main>
    </div>
  );
};

export default App;

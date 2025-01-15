'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Send, Download, Wand2, AlertCircle, BookOpen, X } from 'lucide-react';
import React from 'react';

type WebcamRef = React.RefObject<Webcam>;
type Gender = 'female' | 'male' | '';

const themes = [
  'Cyberpunk Character',
  'Warrior',
  'Steampunk Explorer',
  'Space Traveler',
  'Medieval Knight',
  'Pirate Captain',
  'Superhero',
  '9 to 5 Office Worker',
  'Cartoon Princess/Prince',
  'Western Cowboy',
  'Minceraft Character',
  'President',
  'Mythical Creature',
  'Sports Player',
];

const styles = ['photographic', 'cinematic', 'cartoon'];

export default function SelfieBooth() {
  const webcamRef = useRef<Webcam>(null) as WebcamRef;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [themeImage, setThemeImage] = useState<string | null>(null);
  const [headshotImage, setHeadshotImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [retakeCount, setRetakeCount] = useState(0);
  const [selectedGender, setSelectedGender] = useState<Gender>('');
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 1000);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setThemeImage(null);
      setHeadshotImage(null);
      setSelectedTheme(null);
    }
  }, []);

	const handleThemeSelect = (theme: string) => {
	  if (!capturedImage) {
		setError('Please capture an image first');
		return;
	  }
	  setSelectedTheme(theme);
	  setThemeImage(null);
	  setHeadshotImage(null);
	  setError(null);
	};


	const processImage = async () => {
	  if (!capturedImage || !selectedTheme) return;

	  setIsProcessing(true);
	  setError(null);

	  try {
		const endpoint = '/api/process-image';
		const genderPrefix = selectedGender ? `${selectedGender} ` : '';

		const requestBody = {
		  image: capturedImage,
		  theme: `${genderPrefix}${selectedTheme}`,
		  style: styles[Math.floor(Math.random() * styles.length)],
		};

		const response = await fetch(endpoint, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (!response.ok || !data.themeImage || !data.headshotImage) {
		  throw new Error(data.error || 'Failed to process images');
		}

		// Ensure both images are set simultaneously
		setThemeImage(data.themeImage);
		setHeadshotImage(data.headshotImage);
	  } catch (err) {
		console.error('Processing error:', err);
		setError(err instanceof Error ? err.message : 'An error occurred while processing the images');
	  } finally {
		setIsProcessing(false);
	  }
	};


  const convertImageToBase64 = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

	const applyEdit = async () => {
	  if (!themeImage || !editPrompt.trim()) return;

	  setIsProcessing(true);
	  setError(null);

	  try {
		const endpoint = '/api/edit-image';

		const requestBody = {
		  image: themeImage,
		  prompt: `Make a small change: ${editPrompt} while keeping everything else exactly the same`,
		  scheduler: 'K_EULER',
		  num_inference_steps: 40,
		  image_guidance_scale: 1.5,
		  guidance_scale: 7.5,
		};

		const response = await fetch(endpoint, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (!response.ok || !data.processedImage) {
		  throw new Error(data.error || 'Failed to apply edit');
		}

		setThemeImage(data.processedImage);
	  } catch (err) {
		console.error('Edit error:', err);
		setError(err instanceof Error ? err.message : 'An error occurred while applying the edit');
	  } finally {
		setProgress(100);
		setTimeout(() => {
		  setIsProcessing(false);
		  setProgress(0);
		}, 500);
	  }
	};


  const sendEmail = async () => {
    if (!themeImage || !headshotImage || !email) return;

    setIsSendingEmail(true);
    setError(null);

    try {
      const base64ThemeImage = await convertImageToBase64(themeImage);
      const base64HeadshotImage = await convertImageToBase64(headshotImage);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          images: [
            { filename: 'themed-image.png', data: base64ThemeImage },
            { filename: 'headshot-image.png', data: base64HeadshotImage },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      setEmail('');
      alert('Email sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const downloadImages = () => {
    if (themeImage) {
      const linkTheme = document.createElement('a');
      linkTheme.href = themeImage;
      linkTheme.download = 'themed-image.png';
      document.body.appendChild(linkTheme);
      linkTheme.click();
      document.body.removeChild(linkTheme);
    }

    if (headshotImage) {
      const linkHeadshot = document.createElement('a');
      linkHeadshot.href = headshotImage;
      linkHeadshot.download = 'headshot-image.png';
      document.body.appendChild(linkHeadshot);
      linkHeadshot.click();
      document.body.removeChild(linkHeadshot);
    }
  };

  const retake = () => {
    if (retakeCount >= 1) {
      setError("You've reached the maximum number of retakes allowed.");
      return;
    }
    setCapturedImage(null);
	setThemeImage(null);
	setHeadshotImage(null);
	setSelectedTheme(null);
	setEditPrompt('');
	setError(null);
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: 'user',
  };

	return (
	  <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
		<div className="max-w-4xl mx-auto">
		  <div className="text-center mb-8">
			<h1 className="text-4xl font-bold text-gray-900 mb-2">AI Selfie Booth</h1>
			<p className="text-lg text-gray-600">Transform yourself into something magical!</p>
		  </div>

		  <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			  <div className="space-y-6">
				{!capturedImage ? (
				  <div className="relative rounded-lg overflow-hidden">
					<Webcam
					  ref={webcamRef}
					  audio={false}
					  screenshotFormat="image/jpeg"
					  videoConstraints={videoConstraints}
					  className="w-full rounded-lg"
					  mirrored
					/>
					<button
					  onClick={captureImage}
					  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-2"
					>
					  <Camera className="w-5 h-5" />
					  <span>Capture</span>
					</button>
				  </div>
				) : (
				  <div className="relative">
					<img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
					<button
					  onClick={retake}
					  disabled={retakeCount >= 1}
					  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
					  <RefreshCw className="w-5 h-5" />
					  <span>Retake {retakeCount === 0 ? '(1 remaining)' : '(no retakes left)'}</span>
					</button>
				  </div>
				)}
			  </div>

			  <div className="space-y-6">
				{capturedImage && !themeImage && !headshotImage && (
				  <div className="text-center space-y-4">
					<div className="flex flex-col items-center space-y-2">
					  <label htmlFor="theme" className="text-sm text-gray-600">
						Choose Your Transformation
					  </label>
					  <select
						id="theme"
						value={selectedTheme || ''}
						onChange={(e) => handleThemeSelect(e.target.value)}
						className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					  >
						<option value="">Select a theme</option>
						{themes.map((theme) => (
						  <option key={theme} value={theme}>
							{theme}
						  </option>
						))}
					  </select>
					</div>

					<div className="flex flex-col items-center space-y-2">
					  <label htmlFor="gender" className="text-sm text-gray-600">
						Specify Gender (Optional)
					  </label>
					  <select
						id="gender"
						value={selectedGender}
						onChange={(e) => setSelectedGender(e.target.value as Gender)}
						className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					  >
						<option value="">No Preference</option>
						<option value="female">Female</option>
						<option value="male">Male</option>
					  </select>
					</div>
				  </div>
				)}

				{selectedTheme && !themeImage && !headshotImage && (
				  <button
					onClick={processImage}
					disabled={isProcessing}
					className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
				  >
					{isProcessing ? 'Processing...' : `Transform into ${selectedTheme}`}
				  </button>
				)}
			  </div>
			</div>
		  </div>

		{themeImage && headshotImage && (
		  <div className="bg-white rounded-lg shadow-xl p-6">
			<div className="mb-6">
			  <h2 className="text-lg font-semibold text-gray-700 mb-4">Themed Transformation</h2>
			  <img
				src={themeImage}
				alt="Themed"
				className="w-full rounded-lg mb-4"
			  />
				<textarea
				  value={editPrompt}
				  onChange={(e) => setEditPrompt(e.target.value)}
				  placeholder="Describe an edit to apply to the themed image..."
				  className="w-full p-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				></textarea>
				<button
				  onClick={applyEdit}
				  className="w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors mt-4"
				>
				  Apply Edit
				</button>
			  <button
				onClick={() => downloadImage(themeImage, 'themed-image.png')}
				className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors mt-4"
			  >
				Download Themed Image
			  </button>
			</div>

			<div className="mb-6">
			  <h2 className="text-lg font-semibold text-gray-700 mb-4">Professional Headshot</h2>
			  <img
				src={headshotImage}
				alt="Headshot"
				className="w-full rounded-lg mb-4"
			  />
			  <button
				onClick={() => downloadImage(headshotImage, 'headshot-image.png')}
				className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
			  >
				Download Headshot
			  </button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			  <div className="space-y-4">
				<input
				  type="email"
				  value={email}
				  onChange={(e) => setEmail(e.target.value)}
				  placeholder="Enter your email"
				  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<button
				  onClick={sendEmail}
				  disabled={isSendingEmail || !email}
				  className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
				  {isSendingEmail ? 'Sending...' : 'Send to Email'}
				</button>
			  </div>

			  <button
				onClick={downloadImages}
				className="w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
			  >
				Download Both Images
			  </button>
			</div>
		  </div>
		)}


		  {error && (
			<div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
		  )}

		  {isProcessing && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
				<div className="space-y-4">
				  <div className="flex justify-center">
					<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
				  </div>
				  <div className="text-center">
					<p className="text-lg font-medium text-gray-700">Creating your AI transformation...</p>
					<p className="text-sm text-gray-500">This usually takes 20-30 seconds</p>
				  </div>
				  <div className="w-full bg-gray-200 rounded-full h-2">
					<div
					  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
					  style={{ width: `${progress}%` }}
					></div>
				  </div>
				</div>
			  </div>
			</div>
		  )}
		</div>
	  </div>
	);
}

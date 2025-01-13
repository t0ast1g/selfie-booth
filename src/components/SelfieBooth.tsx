
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Send, Download, Wand2, AlertCircle, BookOpen, X } from 'lucide-react';

type WebcamRef = React.RefObject<Webcam>;
type Gender = 'female' | 'male' | '';  

const themes = [
  'Cyberpunk Character',
  'Fantasy Warrior',
  'Steampunk Explorer',
  'Space Traveler',
  'Medieval Knight',
  'Pirate Captain',
  'Superhero',
  'Wizard'
];

const styles = [
  'photographic',
  'cinematic'
];

export default function SelfieBooth() {
  const webcamRef = useRef<Webcam>(null) as WebcamRef;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [hasEdited, setHasEdited] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initialProcessing, setInitialProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);  
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [retakeCount, setRetakeCount] = useState(0);  
  const [selectedGender, setSelectedGender] = useState<Gender>('');  



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
      setProcessedImage(null);
      setEditMode(false);
      setHasEdited(false);
      setSelectedTheme(null);
      setInitialProcessing(false);
      setHasReadInstructions(false);
    }
  }, []);

  const selectRandomTheme = () => {
    if (!capturedImage) {
      setError('Please capture an image first');
      return;
    }
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    setSelectedTheme(randomTheme);
    setProcessedImage(null);
    setEditMode(false);
    setHasEdited(false);
  };
  const retryEdit = () => {  
	  setEditMode(true);  
	  setHasEdited(false);  
	  // Keep the current editPrompt value to allow modifications  
  };  

 const processImage = async (isEdit = false) => {  
    if (!capturedImage || (!isEdit && !selectedTheme)) return;  

    setIsProcessing(true);  
    setError(null);  

    try {  
      const endpoint = isEdit ? '/api/edit-image' : '/api/process-image';  
      
      const genderPrefix = selectedGender ? `${selectedGender} ` : '';  
      
      const requestBody = isEdit   
        ? {  
            image: processedImage,  
            prompt: `Make a small change: ${editPrompt} while keeping everything else exactly the same`,  
            scheduler: "K_EULER",  
            num_inference_steps: 40,  
            image_guidance_scale: 1.5,  
            guidance_scale: 7.5  
          }  
        : {  
            image: capturedImage,  
            theme: `${genderPrefix}${selectedTheme}`,  
            style: styles[Math.floor(Math.random() * styles.length)]  
          };  

    const response = await fetch(endpoint, {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
      },  
      body: JSON.stringify(requestBody),  
    });  

    const data = await response.json();  

		if (!response.ok) {  
		  throw new Error(data.error || 'Failed to process image');  
		}  

		if (!data.processedImage) {  
		  throw new Error('No processed image received');  
		}  

		setProcessedImage(data.processedImage);  
		if (isEdit) {  
		  setHasEdited(true);  
		  setEditMode(false);  
		} else {  
		  setInitialProcessing(true);  
		  setEditMode(true);  
		}  
	  } catch (err) {  
		console.error('Processing error:', err);  
		setError(err instanceof Error ? err.message : 'An error occurred while processing the image');  
	  } finally {  
		setProgress(100);  
		setTimeout(() => {  
		  setIsProcessing(false);  
		  setProgress(0);  
		}, 500);  
	  }  
	};
  const sendEmail = async () => {
    if (!processedImage || !email || !hasEdited) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          image: processedImage,
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
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage || !hasEdited) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'ai-selfie.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

	const retake = () => {  
	  if (retakeCount >= 1) {  
		setError("You've reached the maximum number of retakes allowed.");  
		return;  
	  }  
	  setCapturedImage(null);  
	  setProcessedImage(null);  
	  setSelectedTheme(null);  
	  setError(null);  
	  setEditMode(false);  
	  setHasEdited(false);  
	  setEditPrompt('');  
	  setInitialProcessing(false);  
	  setHasReadInstructions(false);  
	  setRetakeCount(retakeCount + 1);
	  setSelectedGender(''); 
	  
	};

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

	const InstructionsModal = ({ setShowInstructions, setHasReadInstructions }) => (  
	  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">  
		<div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 relative">  
		  <button  
			onClick={() => setShowInstructions(false)}  
			className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"  
		  >  
			<X className="w-6 h-6" />  
		  </button>  
		  
		  <div className="space-y-6">  
			<h3 className="text-2xl font-bold text-gray-900">How to Edit Your Image</h3>  
			
			<div className="space-y-4">  
			  <div className="bg-blue-50 p-4 rounded-lg">  
				<h4 className="font-medium text-gray-900 mb-2">Key Guidelines:</h4>  
				<ul className="list-disc list-inside space-y-2 text-gray-700">  
				  <li>If you dont like the way the image turned out, you may retake it (limit of 1 retake)</li>  
				  <li>Be specific about what you want to change</li>  
				  <li>Mention locations if neccessary (left, right, top, etc.)</li>  
				  <li>Include colors or styles when relevant</li>  
				  <li>Keep changes simple and focused</li>  
				</ul>  
			  </div>  

			  <div>  
				<h4 className="font-medium text-gray-900 mb-2">Example Prompts:</h4>  
				<ul className="list-disc list-inside space-y-2 text-blue-600">  
				  <li>"Remove the black headphones"</li>  
				  <li>"Add small gold earrings"</li>  
				  <li>"Change the background color to light blue but keep the person exactly the same"</li>  
				  <li>"Add a small silver necklace that rests just above the collarbones"</li>  
				</ul>  
			  </div>  

			  <div className="bg-yellow-50 p-4 rounded-lg">  
				<h4 className="font-medium text-gray-900 mb-2">Important Tips:</h4>  
				<ul className="list-disc list-inside space-y-2 text-gray-700">  
				  <li>When changing the background, always end with "while keeping everything else exactly the same"</li>  
				  <li>Make one change at a time for best results</li>  
				  <li>Be patient - each edit takes about 20-30 seconds</li>  
				  <li>If an edit doesn't work, try rephrasing your instruction</li>  
				</ul>  
			  </div>  
			</div>  

			<button  
			  onClick={() => {  
				setHasReadInstructions(true);  
				setShowInstructions(false);  
			  }}  
			  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"  
			>  
			  I Understand  
			</button>  
		  </div>  
		</div>  
	  </div>  
	);  
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
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full rounded-lg"
                  />
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
		{capturedImage && !processedImage && (  
			<div className="text-center">  
			  <button  
				onClick={selectRandomTheme}  
				className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"  
				disabled={isProcessing || processedImage !== null}  
			  >  
				Get Random Theme!  
			  </button>  
			  {selectedTheme && (  
				<div className="mt-4 space-y-4">  
				  <p className="text-lg font-medium text-gray-700">  
					Theme: {selectedTheme}  
				  </p>  
				  
				  {/* Add this new dropdown */}  
				  <div className="flex flex-col items-center space-y-2">  
					<label htmlFor="gender" className="text-sm text-gray-600">  
					  Optional: Specify Gender  
					</label>  
					<select  
					  id="gender"  
					  value={selectedGender}  
					  onChange={(e) => setSelectedGender(e.target.value as Gender)}  
					  className="w-full max-w-xs p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"  
					>  
					  <option value="">No Preference</option>  
					  <option value="female">Female</option>  
					  <option value="male">Male</option>  
					</select>  
				  </div>  
				</div>  
			  )}  
			</div>  
		  )}  

              {selectedTheme && !processedImage && (
                <button
                  onClick={() => processImage(false)}
                  disabled={isProcessing}
                  className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Transform into ${selectedTheme}`}
                </button>
              )}

			{processedImage && editMode && (  
			  <div className="space-y-4">  
				<button  
				  onClick={() => setShowInstructions(true)}  
				  className="w-full bg-blue-100 text-blue-700 px-6 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"  
				>  
				  <BookOpen className="w-5 h-5" />  
				  <span>View Editing Instructions</span>  
				</button>  
				
				<textarea  
				  value={editPrompt}  
				  onChange={(e) => setEditPrompt(e.target.value)}  
				  placeholder={hasReadInstructions   
					? "Describe how you want to modify the image..."   
					: "Please read the instructions first"}  
				  className="w-full p-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"  
				  disabled={!hasReadInstructions}  
				/>  
				
				<button  
				  onClick={() => processImage(true)}  
				  disabled={isProcessing || !editPrompt.trim() || !hasReadInstructions}  
				  className="w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"  
				>  
				  <Wand2 className="w-5 h-5" />  
				  <span>{isProcessing ? 'Processing...' : 'Apply Edit'}</span>  
				</button>  
			  </div>  
			)}   
            </div>
          </div>
		  {/* Add the modal at the end of your component, just before the final closing div */}  
			{showInstructions && (  
			  <InstructionsModal   
				setShowInstructions={setShowInstructions}  
				setHasReadInstructions={setHasReadInstructions}  
			  />  
			)} 
        </div>

		{processedImage && (  
		  <div className="bg-white rounded-lg shadow-xl p-6">  
			<img  
			  src={processedImage}  
			  alt="Processed"  
			  className="w-full rounded-lg mb-6"  
			/>  
			
			{!editMode && (  
			  <div className="mb-6 flex flex-col space-y-4">  
				{!hasEdited && (  
				  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">  
					<AlertCircle className="w-5 h-5 text-yellow-500" />  
					<p className="text-sm text-yellow-700">  
					  Please edit your image using the edit prompt above before downloading or sending.  
					</p>  
				  </div>  
				)}  
				
				<button  
				  onClick={retryEdit}  
				  className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"  
				>  
				  <RefreshCw className="w-5 h-5" />  
				  <span>Retry Edit</span>  
				</button>  
			  </div>  
			)}  
		
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!hasEdited}
                />
                <button
                  onClick={sendEmail}
                  disabled={isProcessing || !email || !hasEdited}
                  className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{isProcessing ? 'Sending...' : 'Send to Email'}</span>
                </button>
              </div>
              
              <button
                onClick={downloadImage}
                disabled={!hasEdited}
                className="w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Image</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
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
                <p className="text-center text-sm text-gray-500">
                  {progress < 100 ? 'Processing...' : 'Almost done!'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  Send,
  Download,
  Wand2,
  AlertCircle,
  BookOpen,
  X,
} from "lucide-react";
import React from "react";

type WebcamRef = React.RefObject<Webcam>;
type Gender = "female" | "male" | "";

const themes = [
  "Cyberpunk Character",
  "Warrior",
  "Steampunk Explorer",
  "Space Traveler",
  "Medieval Knight",
  "Pirate Captain",
  "Superhero",
  "9 to 5 Office Worker",
  "Cartoon Princess/Prince",
  "Western Cowboy",
  "Minceraft Character",
  "President",
  "Mythical Creature",
  "Sports Player",
];

const styles = ["photographic", "cinematic", "cartoon"];

export default function SelfieBooth() {
  const webcamRef = useRef<Webcam>(null) as WebcamRef;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [themeImage, setThemeImage] = useState<string | null>(null);
  const [headshotImage, setHeadshotImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedGender, setSelectedGender] = useState<Gender>("");
  const [editPrompt, setEditPrompt] = useState("");
  const [showAgreement, setShowAgreement] = useState(true);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
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

  const applyEdit = async () => {
    if (!themeImage || !editPrompt) {
      setError("Please provide an edit description");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: themeImage,
          prompt: editPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.editedImage) {
        throw new Error(data.error || "Failed to apply edit");
      }

      setThemeImage(data.editedImage);
      setEditPrompt("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while applying the edit",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const PrivacyAgreement = ({ onAccept }: { onAccept: () => void }) => {
    const [accepted, setAccepted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (accepted) {
        onAccept();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-[#0171C5] mb-6">
              Photo Booth Participation Agreement
            </h1>

            <p className="mb-4">
              Thank you for participating in our photo booth experience! By
              signing this agreement, you acknowledge and consent to the
              following terms:
            </p>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0171C5] mb-2">
                  1. Use of Images
                </h2>
                <p>
                  By participating in the photo booth, you grant AI OWL the
                  right to use your AI-generated image for internal and external
                  marketing purposes, including but not limited to promotional
                  materials, social media, website content, and advertising
                  campaigns.
                </p>
                <p>
                  Only the AI-generated image created from your participation
                  will be used for marketing purposes. Your original photograph
                  and personal data will not be shared or used in any way.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0171C5] mb-2">
                  2. Data Privacy
                </h2>
                <p>
                  Your email address or any other personal information collected
                  during your participation will be kept confidential and will
                  not be sold, shared, or distributed to any third parties.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0171C5] mb-2">
                  3. Scope of Use
                </h2>
                <p>
                  Your AI-generated image will be used exclusively for marketing
                  purposes as described above and will not be utilized for any
                  other purposes without your explicit consent.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0171C5] mb-2">
                  4. Voluntary Participation
                </h2>
                <p>
                  Participation in the photo booth is entirely voluntary. By
                  signing below, you confirm that you understand and agree to
                  the terms outlined in this agreement.
                </p>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold text-[#0171C5] mb-4">
                Acknowledgment and Consent
              </h2>
              <p className="mb-4">
                By checking the box below, I confirm that I have read and
                understood the terms of this agreement. I consent to the use of
                my AI-generated image for the purposes stated above.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="agreement">
                    I agree to the terms and conditions.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!accepted}
                  className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      setError("Please capture an image first");
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
      const response = await fetch("/api/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: capturedImage,
          theme: `${selectedGender ? `${selectedGender} ` : ""}${selectedTheme}`,
          style: styles[Math.floor(Math.random() * styles.length)],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.themeImage || !data.headshotImage) {
        throw new Error(data.error || "Failed to process images");
      }

      setThemeImage(data.themeImage);
      setHeadshotImage(data.headshotImage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while processing the images",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const combineImageWithBanner = async (
    imageUrl: string,
    bannerNumber: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const banner = new Image();
          banner.crossOrigin = "anonymous";
          banner.onload = () => {
            ctx.drawImage(banner, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          };
          banner.onerror = reject;
          banner.src = `/Banner ${bannerNumber}.png`;
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const sendEmail = async () => {
    if (!themeImage || !headshotImage || !email) {
      setError("Missing email or images.");
      return;
    }

    setIsSendingEmail(true);
    setError(null);

    try {
      // Convert image URLs to base64
      const convertToBase64 = async (url: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const themeBase64 = await convertToBase64(themeImage);
      const headshotBase64 = await convertToBase64(headshotImage);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          images: [themeBase64, headshotBase64],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      setEmail("");
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Email sending error:", err);
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    if (!imageUrl) return;

    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download image");
    }
  };

  const retake = () => {
    setShowAgreement(true);
    setAgreementAccepted(false);
    setCapturedImage(null);
    setThemeImage(null);
    setHeadshotImage(null);
    setSelectedTheme(null);
    setEditPrompt("");
    setError(null);
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user",
  };

  

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {showAgreement && (
        <PrivacyAgreement
          onAccept={() => {
            setShowAgreement(false);
            setAgreementAccepted(true);
          }}
        />
      )}
      {!showAgreement && (
        <div className="max-w-4xl mx-auto">
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
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
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
                        value={selectedTheme || ""}
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
                        onChange={(e) =>
                          setSelectedGender(e.target.value as Gender)
                        }
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
                    {isProcessing
                      ? "Processing..."
                      : `Transform into ${selectedTheme}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {(themeImage || headshotImage) && (
            <div className="bg-white rounded-lg shadow-xl p-6">
              {themeImage && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Themed Transformation
                  </h2>
                  <img src={themeImage} alt="Themed" className="w-full rounded-lg mb-4" />
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe an edit to apply to the themed image..."
                    className="w-full p-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={applyEdit}
                    className="w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors mt-4"
                  >
                    Apply Edit
                  </button>
                  <button
                    onClick={() => downloadImage(themeImage, "themed-image.png")}
                    className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors mt-4"
                  >
                    Download Themed Image
                  </button>
                </div>
              )}

              {headshotImage && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Professional Headshot
                  </h2>
                  <img src={headshotImage} alt="Headshot" className="w-full rounded-lg mb-4" />
                  <button
                    onClick={() => downloadImage(headshotImage, "headshot-image.png")}
                    className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Download Headshot
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
                  />
                  <button
                    onClick={sendEmail}
                    disabled={isSendingEmail || !email}
                    className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? "Sending..." : "Send to Email"}
                  </button>
                </div>
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
                    <p className="text-lg font-medium text-gray-700">
                      Creating your AI transformation...
                    </p>
                    <p className="text-sm text-gray-500">
                      This usually takes 20-30 seconds
                    </p>
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
      )}
    </div>
  );
}

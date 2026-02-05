import { useState, useEffect } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createProfile } from '../utilities/database';
import { uploadProfilePhoto } from '../utilities/storage';

// Common Northwestern majors for autocomplete
const COMMON_MAJORS = [
  'Computer Science',
  'Economics',
  'Psychology',
  'Biology',
  'Political Science',
  'Communication Studies',
  'Journalism',
  'Engineering',
  'Mathematics',
  'Chemistry',
  'Physics',
  'History',
  'English',
  'Sociology',
  'Neuroscience',
  'Business',
  'Art History',
  'Music',
  'Theatre',
  'Philosophy',
];

export default function CreateProfile() {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    if (currentUser.year && currentUser.major) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Pre-fill photo from Google account
  useEffect(() => {
    if (currentUser) {
      if (currentUser.photoURL && !photoURL) {
        setPhotoURL(currentUser.photoURL);
      }
    }
  }, [currentUser, name, photoURL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setIsLoading(true);
    try {
      let finalPhotoURL = photoURL;
      if (selectedFile) {
        setUploadProgress(true);
        finalPhotoURL = await uploadProfilePhoto(currentUser.uid, selectedFile);
        setUploadProgress(false);
      }
      await createProfile(currentUser.uid, name, year, major, currentUser.email || '', finalPhotoURL);
      updateProfile({ name, year, major, photoURL: finalPhotoURL });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoURL(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredMajors = COMMON_MAJORS.filter(m =>
    m.toLowerCase().includes(major.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
          <p className="text-purple-200 mt-2">Just a few more details to get started</p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <div className="w-8 h-1 rounded-full bg-white/50"></div>
            <div className="w-3 h-3 rounded-full bg-white/50"></div>
          </div>
          <p className="text-purple-200 text-xs mt-2">Step 1 of 2</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Profile Photo Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploadProgress}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {photoURL ? 'Click to change photo' : 'Add a profile photo'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="How should others call you?"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Select your year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>

            {/* Major with autocomplete */}
            <div className="relative">
              <label htmlFor="major" className="block text-sm font-semibold text-gray-700 mb-2">
                Major
              </label>
              <input
                type="text"
                id="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                onFocus={() => setShowMajorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMajorSuggestions(false), 200)}
                required
                placeholder="Start typing your major..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {showMajorSuggestions && filteredMajors.length > 0 && major.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredMajors.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMajor(m);
                        setShowMajorSuggestions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-purple-50 text-gray-700 hover:text-purple-900 text-sm"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || uploadProgress || !year}
              className="w-full py-3 px-4 bg-purple-900 text-white rounded-xl font-semibold hover:bg-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploadProgress ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading photo...
                </>
              ) : isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating profile...
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

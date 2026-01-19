import { useState, useEffect } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateProfile } from '../utilities/database';
import { uploadProfilePhoto } from '../utilities/storage';

export default function ProfileSettings() {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const { currentUser, updateProfile: updateAuthProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadProfile();
  }, [currentUser, navigate]);

  const loadProfile = async () => {
    if (!currentUser) return;
    try {
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setName(profile.name);
        setYear(profile.year);
        setMajor(profile.major);
        setPhotoURL(profile.photoURL);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

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
      await updateProfile(currentUser.uid, name, year, major, finalPhotoURL);
      updateAuthProfile({ name, year, major, photoURL: finalPhotoURL });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900">Profile Settings</h1>
          <p className="text-sm text-gray-600 mt-2">Update your profile information</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {photoURL && (
          <div className="mb-6 flex justify-center">
            <img src={photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-purple-600" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select Year</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>
          <div>
            <label htmlFor="major" className="block text-sm font-medium text-gray-700">Major</label>
            <input
              type="text"
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Profile Photo</label>
            <input
              type="file"
              id="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploadProgress}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || uploadProgress}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {uploadProgress ? 'Uploading photo...' : isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-black border border-1 border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
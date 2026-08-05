import React, { useState } from 'react';
import { Upload, FileText, Bot, Loader2, CheckCircle, AlertCircle, X, Save, Info, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

interface ParsedBooking {
  id: string;
  clientName: string;
  clientPhone?: string;
  date: string;
  time: string;
  pickupLocation: string;
  dropoffLocation: string;
  passengers: number;
  carType?: string;
  price?: number;
  description?: string;
}

export default function AIBookingAssistant() {
  const navigate = useNavigate();
  const { addProject, carTypes, companies } = useData();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedBookings, setParsedBookings] = useState<ParsedBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [savingBookings, setSavingBookings] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith('.csv') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a CSV or PNG/JPG image file');
        setFile(null);
      }
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      alert('API Key saved successfully!');
    }
  };

  const processFile = async () => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (inputMode === 'file' && !file) {
      setError('Please upload a file');
      return;
    }

    if (inputMode === 'text' && !textInput.trim()) {
      setError('Please paste booking information');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let fileContent: string;
      let fileType: string;

      if (inputMode === 'text') {
        fileContent = textInput;
        fileType = 'text/plain';
      } else {
        fileContent = await readFileContent(file!);
        fileType = file!.type;
      }

      const bookings = await analyzeWithAI(fileContent, fileType);

      setParsedBookings(bookings);
      setSummary(`Successfully parsed ${bookings.length} booking(s) from the ${inputMode === 'text' ? 'text' : 'file'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.includes('image')) {
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const text = reader.result as string;
          resolve(text);
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
      }
    });
  };

  const analyzeWithAI = async (content: string, fileType: string): Promise<ParsedBooking[]> => {
    const isImage = fileType.includes('image');

    const systemPrompt = `You are a booking data extraction assistant. Extract booking information and return ONLY a valid JSON array of bookings. Each booking must have these fields:
- clientName (string)
- clientPhone (string, optional - phone number, email, or contact info)
- date (YYYY-MM-DD format)
- time (HH:MM format, 24-hour)
- pickupLocation (string)
- dropoffLocation (string)
- passengers (number)
- carType (string, optional - vehicle type. Use these exact values: "STANDARD", "EXECUTIVE", "VAN", "MINIBUS". Map common variations like "Saloon/Estate/Car" to "STANDARD", "Premium/Luxury/First Class" to "EXECUTIVE", "People Carrier/Large People Carrier/MPV/8-seater" to "VAN", "Minibus/Coach/Large Group" to "MINIBUS")
- price (number, optional)
- description (string, optional)

Return ONLY the JSON array, no other text.`;

    const userPrompt = isImage
      ? 'Extract all booking information from this image.'
      : `Extract all booking information from this CSV data:\n\n${content}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: isImage
          ? [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: content } }
            ]
          : userPrompt
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: isImage ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze file with AI');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON. Please try again.');
    }

    const bookings = JSON.parse(jsonMatch[0]);

    return bookings.map((booking: any, index: number) => {
      let carType = booking.carType || '';
      const carTypeLower = (carType || '').toString().toLowerCase();

      if (carTypeLower.includes('people carrier') ||
          carTypeLower.includes('peoplecarrier') ||
          carTypeLower.includes('mpv') ||
          carTypeLower.includes('8-seater') ||
          carTypeLower.includes('8 seater')) {
        carType = 'VAN';
      } else if (carTypeLower.includes('saloon') ||
                 carTypeLower.includes('estate') ||
                 carTypeLower.includes('sedan') ||
                 carTypeLower.includes('car')) {
        carType = 'STANDARD';
      } else if (carTypeLower.includes('executive') ||
                 carTypeLower.includes('premium') ||
                 carTypeLower.includes('luxury') ||
                 carTypeLower.includes('first class')) {
        carType = 'EXECUTIVE';
      } else if (carTypeLower.includes('minibus') ||
                 carTypeLower.includes('coach') ||
                 carTypeLower.includes('large group')) {
        carType = 'MINIBUS';
      }

      return {
        id: `temp-${Date.now()}-${index}`,
        clientName: booking.clientName || 'Unknown Client',
        clientPhone: booking.clientPhone || '',
        date: booking.date || new Date().toISOString().split('T')[0],
        time: booking.time || '12:00',
        pickupLocation: booking.pickupLocation || '',
        dropoffLocation: booking.dropoffLocation || '',
        passengers: booking.passengers || 1,
        carType: carType,
        price: booking.price,
        description: booking.description
      };
    });
  };

  const handleSaveBooking = async (booking: ParsedBooking) => {
    try {
      setSavingBookings(prev => new Set(prev).add(booking.id));
      setError(null);

      let carTypeId = '';
      if (booking.carType && carTypes.length > 0) {
        const bookingCarTypeLower = (booking.carType || '').toString().toLowerCase();
        const matchingCarType = carTypes.find(
          ct => ct.type && ct.type.toLowerCase() === bookingCarTypeLower
        );
        if (matchingCarType) {
          carTypeId = matchingCarType.id;
        }
      }

      await addProject({
        company: selectedCompany,
        description: booking.description || `AI imported booking for ${booking.clientName}`,
        bookingId: `AI-${Date.now()}`,
        driver: '',
        date: booking.date,
        time: booking.time,
        passengers: booking.passengers,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        carType: carTypeId,
        price: booking.price || 0,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone || '',
        paymentStatus: 'charge'
      });

      setParsedBookings(prev => prev.filter(b => b.id !== booking.id));
      setSummary(`Successfully saved booking for ${booking.clientName}!`);

      setTimeout(() => setSummary(''), 3000);
    } catch (err) {
      setError(`Failed to save booking: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSavingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(booking.id);
        return newSet;
      });
    }
  };

  const handleSaveAllBookings = async () => {
    for (const booking of parsedBookings) {
      await handleSaveBooking(booking);
    }
  };

  const handleRemoveBooking = (bookingId: string) => {
    setParsedBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            AI Booking Assistant
          </h1>
          <p className="text-slate-600">
            Upload CSV or images, or paste booking data and let AI extract the information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mb-6">
                  All extracted bookings will be saved with this company
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored locally in your browser
                </p>

                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Need an API Key?</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        To use the full potential of RidePilot AI Assistant, please contact us to receive your OpenAI API Key.
                      </p>
                      <a
                        href="mailto:ridepilot.info@gmail.com?subject=Request%20for%20OpenAI%20API%20Key"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        ridepilot.info@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setInputMode('file')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      inputMode === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      inputMode === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Paste Text
                  </button>
                </div>

                {inputMode === 'file' ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {file ? file.name : 'Click to upload CSV or PNG/JPG'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your booking information here...&#10;&#10;Example:&#10;Client: John Doe&#10;Date: 2025-11-06&#10;Time: 19:00&#10;Pickup: Venice Airport&#10;Dropoff: YouMe Design Place Hotel&#10;..."
                      className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={processFile}
                disabled={(!file && !textInput.trim()) || !apiKey || isProcessing || !selectedCompany}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </button>

              {!selectedCompany && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">Please select a company before analyzing bookings</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {summary && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{summary}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Extracted Bookings
                </h2>
                {parsedBookings.length > 0 && (
                  <button
                    onClick={handleSaveAllBookings}
                    disabled={savingBookings.size > 0}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    Save All to Projects
                  </button>
                )}
              </div>

              {parsedBookings.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{parsedBookings.length} booking(s) ready to save</p>
                  {selectedCompany && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      Will be saved to: {companies.find(c => c.id === selectedCompany)?.name}
                    </p>
                  )}
                </div>
              )}

              {parsedBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings extracted yet</p>
                  <p className="text-sm text-gray-400 mt-2">Upload a file and analyze it to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.clientName}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveBooking(booking)}
                            disabled={savingBookings.has(booking.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save to projects"
                          >
                            {savingBookings.has(booking.id) ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveBooking(booking.id)}
                            disabled={savingBookings.has(booking.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 text-gray-900">{booking.date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="ml-2 text-gray-900">{booking.time}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pickup:</span>
                          <span className="ml-2 text-gray-900">{booking.pickupLocation}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dropoff:</span>
                          <span className="ml-2 text-gray-900">{booking.dropoffLocation}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Passengers:</span>
                          <span className="ml-2 text-gray-900">{booking.passengers}</span>
                        </div>
                        {booking.clientPhone && (
                          <div>
                            <span className="text-gray-500">Contact:</span>
                            <span className="ml-2 text-gray-900">{booking.clientPhone}</span>
                          </div>
                        )}
                        {booking.carType && (
                          <div>
                            <span className="text-gray-500">Car Type:</span>
                            <span className="ml-2 text-gray-900">{booking.carType}</span>
                          </div>
                        )}
                        {booking.price && (
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 text-gray-900">€{booking.price}</span>
                          </div>
                        )}
                      </div>

                      {booking.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">Notes:</span>
                          <p className="text-gray-900 text-sm mt-1">{booking.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

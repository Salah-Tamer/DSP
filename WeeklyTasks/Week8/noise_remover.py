import librosa
import numpy as np
import soundfile as sf
import matplotlib.pyplot as plt

# Load the noisy audio file
y, sr = librosa.load('noisy_audio.wav')
print(y.shape)

# Compute the Short-Time Fourier Transform (STFT)
D = librosa.stft(y)
#Estimate the magnitude spectrogram for each frequency in D
magnitude = np.abs(D)
# Estimate the noise level from the first few frames
noise_level = np.mean(magnitude[:, :1000])

# Spectral subtraction: subtract the estimated noise level from the magnitude
cleaned_magnitude = np.maximum(magnitude - noise_level, 0)
# Reconstruct the complex STFT with the cleaned magnitude and original phase
cleaned_D = cleaned_magnitude * np.exp(1j * np.angle(D))
cleaned_audio = librosa.istft(cleaned_D)

# Save the cleaned audio to a file
sf.write('cleaned_audio.wav', cleaned_audio, sr)
# Plot the original and cleaned audio waveforms
plt.subplot(2, 1, 1)
plt.title('Original Audio')
plt.plot(y)
plt.subplot(2, 1, 2)
plt.title('Cleaned Audio')
plt.plot(cleaned_audio)

plt.show()

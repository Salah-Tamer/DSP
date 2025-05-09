import cv2
import numpy as np



image = cv2.imread('C:\\Users\CRIZMA MEGA STORE\Downloads\cat graphic/bright-day.jpg')


cv2.imshow('Original Image', image)


gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)




cropped_image = image[50:200, 50:200]


blurred = cv2.GaussianBlur(image, (15, 15), 0)


kernel_sharpening = np.array([[-1, -1, -1],
                               [-1,  9, -1],
                               [-1, -1, -1]])
sharpened_image = cv2.filter2D(image, -1, kernel_sharpening)



edges = cv2.Canny(gray_image, 100, 200)




def resize_image(image, width=400, height=400):
    return cv2.resize(image, (width, height))

cv2.imshow('Original Image', resize_image(image))
cv2.imshow('Grayscale Image', resize_image(gray_image))
cv2.imshow('Cropped Image', resize_image(cropped_image))
cv2.imshow('Sharpened Image', resize_image(sharpened_image))
cv2.imshow('Edge Detection', resize_image(edges))
cv2.imshow('blurred Image', resize_image(blurred))




cv2.waitKey(0)
cv2.destroyAllWindows()

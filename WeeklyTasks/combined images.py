import cv2
import numpy as np


image = cv2.imread('C:\\Users\CRIZMA MEGA STORE\Downloads\cat graphic/moon_PNG20.png')


new_width, new_height = 400, 400
image_resized = cv2.resize(image, (new_width, new_height))


inverted_image = 255 - image_resized


rotated_image = cv2.rotate(inverted_image, cv2.ROTATE_90_COUNTERCLOCKWISE)


rotated_image_resized = cv2.resize(rotated_image, (new_width, new_height))


combined_image = np.hstack((image_resized, rotated_image_resized))


cv2.imshow("Combined Image", combined_image)


cv2.waitKey(0)
cv2.destroyAllWindows()

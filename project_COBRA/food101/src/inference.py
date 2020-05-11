import numpy as np
import tensorflow as tf
import cv2
from tensorflow.keras import backend as K

import os

print(tf.__version__)


def predict(img):
    img = img[1:]

    with open('_static/food101/labels.txt', 'r') as f:
        label_names = f.read()
        label_names = label_names.split('\n')
    label_dict = {idx: label for (idx, label) in enumerate(label_names)}

    img = cv2.imread(img)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    model = tf.keras.models.load_model("_static/food101/models/effnb0.h5",
                                        compile=False,
                                        custom_objects= {
                                            'FixedDropout': FixedDropout,
                                            'swish': tf.compat.v2.nn.swish,
                                        }
                                        )

    softmax_output = model.predict(_preprocess_img(img))
    max_prob = np.argmax(softmax_output)
    prediction = label_dict[max_prob]

    return {'prediction': prediction}


def _preprocess_img(img):
    img = img / 255.
    img = tf.cast(img, tf.float32)
    img = tf.image.resize(img, (244,244))
    img = tf.expand_dims(img, 0)
    return img

class FixedDropout(tf.keras.layers.Dropout):
    def _get_noise_shape(self, inputs):
        if self.noise_shape is None:
            return self.noise_shape
        symbolic_shape = K.shape(inputs)
        noise_shape = [symbolic_shape[axis] if shape is None else shape for axis, shape in enumerate(self.noise_shape)]
        return tuple(noise_shape)
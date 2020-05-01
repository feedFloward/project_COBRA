import numpy as np

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input, Dropout, BatchNormalization
from tensorflow.keras.optimizers import SGD, Adam, RMSprop
from tensorflow.keras.utils import to_categorical

from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from sklearn.preprocessing import PolynomialFeatures

from xgboost import DMatrix, XGBClassifier


class Classifier2:
    def __init__(self):
        print('------------------------------------------------')
    

    def fit(self, data):
        self.num_classes = len(data.keys()) -2 #minus 12 wegen canvas_size und ml_specific key
        self.X_train, self.X_vali, self.y_train, self.y_vali = self._preprocess_datapoints(data)

        if self.model_type == 'logistic':
            self.model = LogisticRegression()
            self.model.fit(self.X_train, self.y_train)

        
        if self.model_type == "nn":
            self.y_train = to_categorical(self.y_train)

            if self.y_train.shape[0] > 64:
                self.batch_size = 64
            else:
                self.batch_size = self.y_train.shape[0]

            self.model = self._build_model()

            self.learning_curve =  self.model.fit(x= self.X_train,
                                                y= self.y_train,
                                                batch_size= self.batch_size,
                                                epochs= 200)




        elif self.model_type == "k-nn":
            self.y_train = to_categorical(self.y_train)
            self.model = KNeighborsClassifier()
            self.model.fit(self.X_train, self.y_train)


        elif self.model_type == 'svm':
            self.model = SVC(kernel=self.kernel)
            self.model.fit(self.X_train, self.y_train.tolist())


        elif self.model_type == 'tree':
            self.y_train = to_categorical(self.y_train)
            self.model = DecisionTreeClassifier()
            self.model.fit(self.X_train, self.y_train)

        elif self.model_type == 'forest':
            self.y_train = to_categorical(self.y_train)
            self.model = RandomForestClassifier()
            self.model.fit(self.X_train, self.y_train)

        elif self.model_type == 'boosting':
            self.model = XGBClassifier(max_depth= self.max_tree_depth)
            self.model.fit(self.X_train, self.y_train)

        elif self.model_type == 'naive_bayes':
            self.model = GaussianNB()
            self.model.fit(self.X_train, self.y_train.tolist())
        
        self._test()



    def predict(self):

        if self.model_type == 'svm' or self.model_type == 'boosting' or self.model_type  == 'logistic' or self.model_type == 'naive_bayes':
            mesh_x, mesh_y = np.meshgrid(np.linspace(0, self.canvas_size[0], num=self.canvas_size[0]),
                            np.linspace(0, self.canvas_size[1], num=self.canvas_size[1]))

            Z = self.model.predict(np.c_[mesh_x.ravel(), mesh_y.ravel()])
            Z = Z.reshape(mesh_x.shape)

        else:
            mesh_x, mesh_y = np.meshgrid(np.linspace(0, self.canvas_size[0], num=self.canvas_size[0]),
                                        np.linspace(0, self.canvas_size[1], num=self.canvas_size[1]))

            Z = self.model.predict(np.c_[mesh_x.ravel(), mesh_y.ravel()])
            Z = np.argmax(Z, axis=1)[:, np.newaxis]
            Z = Z.reshape(mesh_x.shape)


        answer_dict = {'Z': Z.tolist()}
        for key, val in self.model_evaluation.items():
            answer_dict.update({key: val.tolist()})

        if self.model_type == 'nn':
            learning_curve = self.learning_curve.history['categorical_accuracy']
            learning_curve = [str(epoch) for epoch in learning_curve]
            answer_dict.update({'learning_curve':  learning_curve})

        
        return answer_dict


    def _preprocess_datapoints(self, data):
        '''Gets JSON with Keys as Classes and Items as Coordinates

        returns
        '''
        
        #read meta data
        self.canvas_size = data.pop('canvas_size', None) #[width, height]
        ml_specific = data.pop('ml_specific', None)
        self.model_type = ml_specific['model']

        try:
            
            self.layers = []
            layer_units = [int(ml_specific[key]) for key in ml_specific if key.startswith("layer_units") ]
            layer_activations = [ml_specific[key] for key in ml_specific if key.startswith("layer_activation") ]
            for l in range(len(layer_units)):
                self.layers.append({'units': layer_units[l], 'activation': layer_activations[l]})


            optimizer_string = ml_specific['optimizer']

            optimizer_dict = {'sgd': SGD,
                            'adam': Adam,
                            'rmsprop': RMSprop}
            self.optimizer = optimizer_dict[optimizer_string]

            self.dropout_rate = float(ml_specific['dropout'])
            self.lr = float(ml_specific['lr'])
            self.lr = 10 ** self.lr

            if ml_specific['batch_norm'] == True:
                self.batch_norm = True
            else:
                self.batch_norm = False

        except:
            pass

        try:
            self.max_tree_depth = ml_specific['max_tree_depth']
        except:
            pass

        try:
            self.kernel = ml_specific['kernel']
        except:
            pass

        self.train_test_split = float(ml_specific['train_test_split'])

        processed_data = []
        for key in data:
            for row in data[key]:
                row.append(int(key))
                processed_data.append(row)

        processed_data = np.array(processed_data)
        processed_data = np.flip(processed_data, axis=0)

        X_train, X_vali, y_train, y_vali = train_test_split(processed_data[:,:2], processed_data[:,-1:], test_size=self.train_test_split)
        return X_train, X_vali, y_train, y_vali

    def _build_model(self):
        model = Sequential()
        
        model.add(Input(shape= (2,)))
        for layer in self.layers:
            model.add(Dense(layer['units'], activation= layer['activation']))
            if self.batch_norm:
                model.add(BatchNormalization())
            if self.dropout_rate > 0:
                model.add(Dropout(self.dropout_rate))

        model.add(Dense(self.num_classes, activation='softmax'))
        model.summary()

        model.compile(optimizer= self.optimizer(lr=self.lr), loss = 'categorical_crossentropy', metrics=['categorical_accuracy'])

        return model

    def _test(self):

        if self.model_type == "logistic":
            y_pred = self.model.predict(self.X_vali)
            cm = confusion_matrix(self.y_vali, y_pred)
        
        elif self.model_type == "nn":
            y_pred = np.argmax(self.model.predict(self.X_vali), axis=1)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "svm":
            y_pred = self.model.predict(self.X_vali)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "tree":
            y_pred = np.argmax(self.model.predict(self.X_vali), axis=1)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "k-nn":
            y_pred = np.argmax(self.model.predict(self.X_vali), axis=1)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "forest":
            y_pred = np.argmax(self.model.predict(self.X_vali), axis=1)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "boosting":
            y_pred = self.model.predict(self.X_vali)
            cm = confusion_matrix(self.y_vali, y_pred)

        elif self.model_type == "naive_bayes":
            y_pred = self.model.predict(self.X_vali)
            cm = confusion_matrix(self.y_vali, y_pred)

        self.model_evaluation = {}
        self.model_evaluation['overall_accuracy'] = np.sum(np.diagonal(cm)) / np.sum(cm)

        self.model_evaluation['precision'] = np.diagonal(cm) / np.sum(cm, axis=0)

        self.model_evaluation['recall'] = np.diagonal(cm) / np.sum(cm, axis=1)

class Classifier:
    def __init__(self, input_dict):

        #extract datapoints
        data = []
        self.num_classes = len(input_dict['data'])
        print(self.num_classes)
        for i, c in enumerate(input_dict['data']):
            for point in c:
                data.append([point['x'], point['y'], i])
        data = np.array(data)
        
        self.X = data[:,:2]
        self.y = data[:,-1:]

        self.model_specs = input_dict['model']
        self.inputspace = input_dict['inputspace']
        self.ml_specs = input_dict['ml_specs']

    def fit(self):
        if self.model_specs['val'] == 'svm':
            kernel = self.ml_specs['kernel']
            self.model = SVC(kernel= kernel)
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'logistic':
            self.model = LogisticRegression()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'tree':
            self.model = DecisionTreeClassifier()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'forest':
            self.model = RandomForestClassifier()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'k-nn':
            self.model = KNeighborsClassifier()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'naive_bayes':
            self.model = GaussianNB()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'boosting':
            self.model = XGBClassifier()
            self.model.fit(self.X, self.y)

        elif self.model_specs['val'] == 'nn':

            y_one_hot = to_categorical(self.y)
            
            layers = self.ml_specs['layers']
            self.model = Sequential()
            self.model.add(Input(shape=(2,)))
            for layer in layers:
                self.model.add(Dense(layer['numberUnits'], activation= layer['activation']))
                if self.ml_specs['batchNorm']:
                    self.model.add(BatchNormalization())
            self.model.add(Dense(units= self.num_classes, activation='softmax'))

            self.model.summary()
            self.model.compile(optimizer= 'adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

            self.model.fit(self.X, y_one_hot, epochs=50)


    def predict(self):
        if self.model_specs['val'] != 'nn':
            mesh_x, mesh_y = np.meshgrid(np.linspace(0, self.inputspace[0], num=self.inputspace[0]),
                            np.linspace(0, self.inputspace[1], num=self.inputspace[1]))

            Z = self.model.predict(np.c_[mesh_x.ravel(), mesh_y.ravel()])
            Z = Z.reshape(mesh_x.shape)

        else:
            mesh_x, mesh_y = np.meshgrid(np.linspace(0, self.inputspace[0], num=self.inputspace[0]),
                                        np.linspace(0, self.inputspace[1], num=self.inputspace[1]))

            Z = self.model.predict(np.c_[mesh_x.ravel(), mesh_y.ravel()])
            Z = np.argmax(Z, axis=1)[:, np.newaxis]
            Z = Z.reshape(mesh_x.shape)


        answer_dict = {'Z': Z.tolist()}
        # for key, val in self.model_evaluation.items():
        #     answer_dict.update({key: val.tolist()})

        # if self.model_type == 'nn':
        #     learning_curve = self.learning_curve.history['categorical_accuracy']
        #     learning_curve = [str(epoch) for epoch in learning_curve]
        #     answer_dict.update({'learning_curve':  learning_curve})

        return answer_dict


class Regression:
    def __init__(self, input_dict):
        data = np.array([[row['x'], row['y']] for row in input_dict['data']])
        self.X = data[:,0][:,np.newaxis]
        self.y = data[:,1][:,np.newaxis]
        self.model_specs = input_dict['model']
        self.inputspace = input_dict['inputspace']
        self.ml_specs = input_dict['ml_specs']


    def fit(self):
        if self.model_specs['val'] == 'linear_regression':
            self.model = LinearRegression()
            polynom = PolynomialFeatures(degree=int(self.ml_specs['polynomial_order']))
            X_transformed = polynom.fit_transform(self.X)
            self.model.fit(X= X_transformed
                        ,y= self.y)

        elif self.model_specs['val'] == 'nn':
            
            self.X = np.true_divide(self.X, self.inputspace[0])


            print(self.ml_specs)
            layers = self.ml_specs['layers']

            self.model = Sequential()

            self.model.add(Input(shape= (1,)))

            for layer in layers:
                self.model.add(Dense(int(layer['numberUnits']), activation= layer['activation']))

            self.model.add(Dense(1, 'linear'))

            self.model.summary()

            self.model.compile(
                optimizer= 'adam'
                ,loss= 'mean_squared_error'
                ,metrics= ['mean_squared_error']
            )

            self.model.fit(x= self.X, y= self.y, batch_size= 32, epochs= 200)

            
    def predict(self):
        if self.model_specs['val'] == 'linear_regression':
            x_range = np.arange(0, self.inputspace[0])[:,np.newaxis]
            x_range_transformed = PolynomialFeatures(degree=int(self.ml_specs['polynomial_order'])).fit_transform(x_range)
            predictions = self.model.predict(x_range_transformed)[:np.newaxis]
            return np.concatenate((x_range, predictions), axis=1).tolist()
        elif self.model_specs['val'] == 'nn':
            x_range = np.arange(0, self.inputspace[0])[:,np.newaxis]
            x_range_transformed = np.true_divide(x_range, self.inputspace[0])
            predictions = self.model.predict(x_range_transformed)[:np.newaxis]
            return np.concatenate((x_range, predictions), axis=1).tolist()
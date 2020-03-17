import numpy as np

from sklearn.cluster import KMeans


class Clustering:
    def __init__(self):
        print('------------------------------------------------')


    def fit(self, data):
        self.X = self._preprocess_data(data)

        self.model = KMeans(n_clusters= self.num_cluster)
        self.model.fit(self.X)


    def predict(self):
        mesh_x, mesh_y = np.meshgrid(np.linspace(0, self.canvas_size[0], num=self.canvas_size[0]),
                                    np.linspace(0, self.canvas_size[1], num=self.canvas_size[1]))

        Z = self.model.predict(np.c_[mesh_x.ravel(), mesh_y.ravel()])
        Z = Z.reshape(mesh_x.shape)


        answer_dict = {'Z': Z.tolist()}
        
        return answer_dict


    def _preprocess_data(self, data):
        self.canvas_size = data.pop('canvas_size', None) #[width, height]
        ml_specific = data.pop('ml_specific', None)
        self.type = ml_specific['clustering_type']
        
        self.num_cluster = int(ml_specific['num_cluster_val'])

        processed_data = []
        for key in data:
            for row in data[key]:
                processed_data.append(row)

        processed_data = np.array(processed_data)
        processed_data = np.flip(processed_data, axis=0)

        return processed_data

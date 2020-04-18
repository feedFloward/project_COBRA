import numpy as np

from scipy.spatial.distance import euclidean

class Optimization:
    def __init__(self, input_dict):
        print(input_dict)

        #basics from json
        self.city_data = input_dict['city_data']
        self.optimization_settings = input_dict['optimization_settings']
        self.circle_mode = self.optimization_settings['circle_mode']
        self.optimization = self.optimization_settings['optimization']
        self.num_steps = int(self.optimization_settings['num_steps'])

        self.num_cities = len(self.city_data)
        self.dist_matrix = self._calc_distmatrix(self.city_data)

        #base permutation of cities:
        if self.circle_mode:
            self.base = np.asarray([ i for i in range(self.num_cities)])[1:]
            self.num_permutable_cities = self.num_cities - 1
        else:
            self.base = np.asarray([ i for i in range(self.num_cities)])
            self.num_permutable_cities = self.num_cities


    def optimize(self):
        if self.optimization == 'simulated_annealing':
            #spezifische Parameter aus json parsen
            initial_temperature = int(self.optimization_settings['initial_temperature'])
            s = self.simulated_annealing(self.num_steps, initial_temperature)

        elif self.optimization == 'random':
            s = self.random_search(self.num_steps)

        elif self.optimization == 'cem':
            N = int(self.optimization_settings['N'])
            s = self.cross_entropy_method(num_steps=self.num_steps, N=N, gamma=0.2)
        
        solution = s[0]
        solution_val = s[1]
        solution_history = s[2]
        val_history = s[3]


        if self.circle_mode:
            solution = np.insert(solution, 0, 0)
            solution = np.append(solution, 0)
            solution_history = np.insert(solution_history, 0, 0, axis=1)
            solution_history = np.apply_along_axis(lambda row: np.append(row, 0), axis=1, arr=solution_history)


        return {'solution': solution.tolist(),
                'metrics': {'total_length': solution_val},
                'solution_history': solution_history.tolist(),
                'metrics_history': {'total_length': val_history.tolist()}
                }


    def random_search(self, num_steps):
        solution = self.base
        solution_val = self._calc_objective_val(solution)

        solution_history = np.asarray([solution])
        val_history = np.asarray(solution_val)

        # DIESE FOR SCHLEIFE NOCH VEKTORISIEREN
        for _ in range(num_steps):
            candidate = np.random.permutation(self.base)
            candidate_val = self._calc_objective_val(candidate)
            if candidate_val < solution_val:
                solution_val = candidate_val
                solution = candidate

            solution_history = np.append(solution_history, [solution], axis=0)
            val_history = np.append(val_history, solution_val)
        
        return solution, solution_val, solution_history, val_history


    def simulated_annealing(self, num_steps, initial_temp, debug=False):
        #initial solution matters

        solution = np.random.permutation(self.base)
        solution_val = self._calc_objective_val(solution)


        solution_history = np.asarray([solution])
        val_history = np.asarray(solution_val)
        # if debug: print("initial solution & value: "+str(solution)+" "+str(solution_val))

        for step in range(num_steps):
            candidate = self._single_swap(solution)
            candidate_val = self._calc_objective_val(candidate)
            # if debug:
            #     print("candidate: "+str(candidate))
            #     print("candidate val: "+str(candidate_val))
            #     print("current solution & value: "+str(solution)+" "+str(solution_val))

            if candidate_val < solution_val:
                # if debug: print("replaced")
                solution = candidate
                solution_val = candidate_val
            else:
                temperature = self._calc_temperature(initial_temp, step, num_steps)
                if debug: print(self._accept_probability(solution_val, candidate_val, temperature))
                if self._accept_probability(solution_val, candidate_val, temperature) > np.random.random():
                    solution = candidate
                    solution_val = candidate_val

            solution_history = np.append(solution_history, [solution], axis=0)
            val_history = np.append(val_history, solution_val)

        return solution, solution_val, solution_history, val_history
    

    def cross_entropy_method(self, num_steps, N, gamma):
        def get_initial_transition_matrix():
            transition_matrix = np.full((self.num_cities, self.num_cities), 1/self.num_permutable_cities)
            np.fill_diagonal(transition_matrix, 0)
            transition_matrix[:,0] = 0
            return transition_matrix

        def draw_next_city(predecessor, transition_matrix):
            return np.random.choice(a=np.arange(1, self.num_cities, 1).astype('int'), p=transition_matrix[predecessor,1:] / sum(transition_matrix[predecessor,1:]))

        def generate_solution(transition_matrix):
            transition_matrix = np.copy(transition_matrix)
            solution_path = [0]
            city = draw_next_city(0, transition_matrix)
            solution_path.append(city)
            transition_matrix[:,city] = 0
            row_sums = transition_matrix.sum(axis=1, keepdims=True)
            transition_matrix = np.divide(transition_matrix, row_sums, out=np.zeros_like(transition_matrix), where=row_sums!=0)
            for _ in range(self.num_permutable_cities - 1):
                city = draw_next_city(solution_path[-1], transition_matrix)
                solution_path.append(city)
                transition_matrix[:,city] = 0
                row_sums = transition_matrix.sum(axis=1, keepdims=True)
                transition_matrix = np.divide(transition_matrix, row_sums, out=np.zeros_like(transition_matrix), where=row_sums!=0)
            return solution_path[1:]

        def check_if_path_exists(city_1, city_2, solution):
            for i in range(len(solution)-1):
                if solution[i]==city_1 and solution[i+1]==city_2:
                    return 1
            return 0

        def update_transition_matrix(best_solutions):
            transition_matrix = np.zeros(shape=(self.num_cities, self.num_cities))
            for i in range(self.num_cities):
                for j in range(1, self.num_cities):
                    if i==j: continue
                    transition_matrix[i,j] = len(best_solutions) * sum([check_if_path_exists(i,j,solution) for solution in best_solutions]) / len(best_solutions)
            transition_matrix = transition_matrix + 0.1
            row_sums = transition_matrix.sum(axis=1, keepdims=True)
            transition_matrix = np.divide(transition_matrix, row_sums, out=np.zeros_like(transition_matrix), where=row_sums!=0)
            return transition_matrix

        transition_matrix = get_initial_transition_matrix()
        initial_solutions = [generate_solution(transition_matrix) for _ in range(N)]
        initial_solutions = np.array([[solution, self._calc_objective_val(solution)] for solution in initial_solutions])
        winners = initial_solutions[initial_solutions[:,1].argsort()][:round(N*gamma)]

        solution_history = np.asarray(winners[:1][:,0].tolist())
        val_history = np.asarray(winners[:1][:,1])

        
        for _ in range(num_steps):
            transition_matrix= update_transition_matrix(winners[:,0])
            solutions = [generate_solution(transition_matrix) for _ in range(N)]
            solutions = np.array([[solution, self._calc_objective_val(solution)] for solution in solutions])
            winners = solutions[solutions[:,1].argsort()][:round(N*gamma)]
            solution_history = np.append(solution_history, winners[:1][:,0].tolist(), axis=0)
            val_history = np.append(val_history, winners[:1][:,1])

        return winners[:1][:,0].tolist(), winners[:1][:,1].item(), solution_history, val_history
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    def _calc_distmatrix(self, input_dicts):
        dist_matrix = np.empty(shape=(self.num_cities, self.num_cities))

        for c1 in range(self.num_cities):
            for c2 in range(self.num_cities):
                c1_coords = [ input_dicts[c1]['x'], input_dicts[c1]['y'] ]
                c2_coords = [ input_dicts[c2]['x'], input_dicts[c2]['y'] ]
                dist_matrix[c1, c2] = euclidean(c1_coords, c2_coords)

        return dist_matrix

    
    def _calc_objective_val(self, candidate):
        if self.circle_mode:
            candidate = np.insert(candidate, 0, 0)
            candidate = np.append(candidate, 0)
        return sum( [ self.dist_matrix[candidate[i], candidate[i + 1]] for i in range(len(candidate) - 1) ] )

    
    def _single_swap(self, permutation, id=None):
        '''
        swaps element at id with following element or random selected element
        '''
        permutation = np.copy(permutation) #copy
        if id == None:
            idx = np.random.randint(0, self.num_permutable_cities -1 )
        else:
            idx = id
        tmp_val = permutation[idx]
        permutation[idx] = permutation[idx + 1]
        permutation[idx + 1] = tmp_val
        return permutation

    
    def _accept_probability(self, solution_cost, candidate_cost, temperature):
        return np.power(np.e, -(candidate_cost - solution_cost) / temperature)

    def _calc_temperature(self, initial_temperature, step, num_steps, step_fraction=True, base_val=0.99):
        if step_fraction:
            return max(0.01, min(1, 1 - step / num_steps)) * initial_temperature
        else:
            return max(initial_temperature * base_val ** step, 0.1)
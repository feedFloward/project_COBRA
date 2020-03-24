FROM continuumio/miniconda

EXPOSE 8000

RUN conda update conda && \
conda create -y -n venv_cobra Python=3.6

ENV PATH /opt/conda/envs/venv_cobra/bin:$PATH

RUN echo "source activate venv_cobra" > ~/.bashrc

ADD . /project_COBRA

WORKDIR /project_COBRA/project_COBRA

RUN ls -la

SHELL ["conda", "run", "-n", "venv_cobra", "/bin/bash", "-c"]

RUN conda config --append channels conda-forge

RUN conda install --file ../requirements.txt

RUN python ./manage.py makemigrations

RUN python ./manage.py migrate

# RUN python ./project_COBRA/manage.py collectstatic --noinput

CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]
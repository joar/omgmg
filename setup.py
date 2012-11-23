from setuptools import setup, find_packages


if __name__ == '__main__':
    setup(
        name='omgmg',
        packages=find_packages(),
        author_email='joar [snail] wandborg [tod] se',
        license='Apache License v2',
        description='GNU MediaGoblin API client',
        install_requires=[
            'Flask',
            'flask-bootstrap',
            'oauthlib',
        ],
    )

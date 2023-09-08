# Solid Server

This folder is used to serve a [CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) instance for testing and development.

Ideally, it would simply be installed as a devDependency instead, but [it doesn't support Node v18](https://github.com/CommunitySolidServer/CommunitySolidServer/issues/1637) (which this project uses). So for the time being, I'm keeping it in a separate package in order to run it with a different Node environment.

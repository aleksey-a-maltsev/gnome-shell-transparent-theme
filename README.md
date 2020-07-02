# Gnome shell themes builder
Based on [Gnome base theme](https://gitlab.gnome.org/GNOME/gnome-shell/-/tree/master/data/theme).

## Installation

* install dependencies:

    `npm i`

* download and prepare default theme (runs automatically during previous command but you can repeat this action if you need to):

    `npm prepare`

## Building themes

The `src` folder contains themes source files. By default after installation it constains default theme and the custom one created as an example how to extend and customize the default theme. You can put your own themes there.

The catalog `out` contains built themes. To fill it just run:

    `npm run build`

All themes from `src` folder will be compiled into `out` folder.

To make themes available to choose in 'Gnome Tweaks' copy or create symlink to them at folder `.themes` in your home folder.
Alternatively you can put them to `/usr/share/themes` folder (root access reguired).

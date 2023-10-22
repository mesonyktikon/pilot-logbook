i tried a number of electronic logbook services and programs and i always find some reason to dislike them.
whoever designs them cannot possibly account for every use case that every user wants; and i like doing neat and funky
things with my data. i want to run fairly complex queries. i want to be able to generate reports. i want to be able
to print out summaries of relevant entries for the examiner, so he doesn't need to spend a week ferociously flipping
through my logbook to find the required experience.

in the past i made an sqlite db (it was long and painful to populate, even though i had fewer hours at the time)
but it proved to be way too inflexible and painful to manipulate data. and modifying the schema was a nightmare.
after planing a few more database schemas i realized that i'm not building a commercial application here...
this is a personal project, and i happen to be a duct tape programmer, so i'll just do what feels most natural and
flexible and minimal. then it occurred to me that the easiest and most flexible way to store data is as plain text files.
as for schema? yaml! i can write it as i speak out. data organization? well, i'm using javascript so i can treat missing
fields as empty/default. flexibility. since there is much data to import, painful by hand, i'm starting with the
essentials: flying time. i'll come back for ground time and remarks and particulars of instrument approaches as i feel
like it.

just as a paper logbook consists of ink and paper, this logbook consists of `data/` and `src/`.
there are no cli arguments/bells and whistles. the code is not meant to be static. tweak it to do what you want it to do.

i'm pushing this publicly as inspiration for other pilot programmers who are not satisfied with existing electronic
logbook "solutions" and looking for other ways to approach the problem.

once the data is fully entered and reports are generated, i'll post them online (and here, for reference). stay tuned :)
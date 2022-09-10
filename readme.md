# Tasky

Very low tech html page to maintain date-stamps for tasks completion.

The idea is that I needed a log for when I've completed certain tasks.  For example, I needed to log when the dog got its last Heartworm/Fleas and Ticks medication. Another log about the timing on the AC Filter has been changed.

## My goals were:

- Quick and simple way to keep a log.
- Only I need to see it, no need to share.
- No authentication and the complexity that it brings.
- I could lose the data without feeling too much pain.


## Why and How

It was more of a reminder to be honest... I already had the solution in mind.  I needed to use __localStorage only__.  That way, I do not have to deal with authentication/authorization schema or permanent store to keep that information. No, just a simple, database-less, storage system.

An added benefit was that nobody else could access and corrupt my data.  It was to be just accessible, from the web, but each person would have their own private "database".

I provide you the tool, you use it by plugging your own private data. The data are secure and private but, sadly temporary and device-bound.  Anybody clearing their localStorage or changing device would lose the data.

So, here it is, a full html/css/javascript solution without using any external package or files. The least amount of tech possible to avoid future fuss about upgrading etc.

## Local storage data

The localStorage value for "Tasky" should be organized like this:
```json
[
    {
        "task": "Dog Meds",
        "values" : [ "20210928", "20211029", "20211127" ]
    },
    {
        "task": "AC Filter",
        "values" : [ "20210928" ]
    }
]
```
NOTE: The date values are stored this way for easy sorting.


Enjoy!

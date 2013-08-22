<?php include('header.tpl'); $state = (isset($state)) ? $state : ''; ?>
    <div class="container">
        <div class="row">
            <div class="span4">
                <div class="card">
                    <h3 class="card-heading">New Collection</h3><hr>
                    <form action="/collection" class="form form-vertical card-body" method="post">
                        <div class="control-group">
                            <label for="name" class="control-label">Name</label>
                            <div class="controls">
                                <input type="text" name="name" id="name" required="required" class="input-block-level">
                            </div>
                        </div>
                            <button type="submit">Create</button>
                    </form>
                </div>
            </div>
            <div class="span8">
                <div class="card">
                    <h3 class="card-heading">Collections</h3><hr>
                    <div class="card-body">
                        <table class="table table-striped table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Last Modified</th>
                                    <th>Last Synced</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if(isset($collections)) : foreach ($collections as $collection) : ?>
                                    <tr>
                                        <td><?=$collection->name ?></td>
                                        <td><?=$collection->lastModified ?></td>
                                        <td><?=$collection->lastSynced ?></td>
                                        <td></td>
                                    </tr>            
                                <?php endforeach; endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        Inside Dashboard! <a href="/logout">Logout</a>
    </div>
<?php include('footer.tpl'); ?>